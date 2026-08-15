# Chart Generation API

## Overview

This endpoint generates a chart (as a PNG image) from a previously uploaded dataset stored in Redis. The dataset is looked up by its `redis_key`, and the chart's shape, columns, and styling are controlled by a `ChartConfig` payload validated with Pydantic.

```
POST /charts/generate/{redis_key}
```

---

## Request

### Path Parameters

| Parameter   | Type     | Description                                                                            |
| ----------- | -------- | -------------------------------------------------------------------------------------- |
| `redis_key` | `string` | Key identifying the dataset previously stored in Redis (e.g. from an upload endpoint). |

### Body: `ChartConfig`

| Field               | Type           | Required      | Default  | Description                                                                                                       |
| ------------------- | -------------- | ------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `chart_type`        | `ChartType`    | Yes           | -        | One of `line`, `bar`, `scatter`, `histogram`, `pie`, `box`.                                                       |
| `x_column`          | `string`       | Yes           | -        | Column used for the x-axis (or as the primary data column for single-column chart types).                         |
| `y_column`          | `string`       | Conditionally | `None`   | Column used for the y-axis. Required for `line`, `bar`, and `scatter`. Ignored for `histogram`, `pie`, and `box`. |
| `color`             | `string`       | No            | `"None"` | Hex (`#FF5733`) or named (`"blue"`) color for the chart elements.                                                 |
| `title`             | `string`       | No            | `None`   | Chart title.                                                                                                      |
| `x_label`           | `string`       | No            | `None`   | Overrides the x-axis label (defaults to `x_column` if not set).                                                   |
| `y_label`           | `string`       | No            | `None`   | Overrides the y-axis label (defaults to `y_column` if not set).                                                   |
| `null_strategy`     | `NullStrategy` | No            | `None`   | Enum for how to handle nulls or invalid values                                                                    |
| `custom_fill_value` | `float`        | No            | `None`   | Float value for nulls or invalid values                                                                           |

#### `ChartType` enum

```python
line | bar | scatter | histogram | pie | box
```

#### `NullStrategy` enum

```python
drop | zero | median | mean | custom
```

---

## Response

**Success:** `200 OK`, `Content-Type: image/png`, a streamed PNG image of the generated chart.

**Errors:**

| Status | Condition                                                                                                                          |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| `404`  | `redis_key` does not exist or the dataset has expired.                                                                             |
| `400`  | `x_column` (or `y_column`, if provided) does not exist in the dataset.                                                             |
| `400`  | `y_column` was omitted for a chart type that requires it (`line`, `bar`, `scatter`).                                               |
| `400`  | `chart_type` is not one of the supported enum values (defensive fallback; Pydantic validation should normally catch this earlier). |
| `422`  | `x_column` (or `y_column`) has no numeric value.                                                                                   |
| `200`  | Data had some invalid values and is asking for what to do with those.                                                              |

---

## Chart Type Behavior

| Chart Type  | Uses `x_column` as                  | Uses `y_column`? | Matplotlib call                 |
| ----------- | ----------------------------------- | ---------------- | ------------------------------- |
| `line`      | x-axis values                       | Required         | `ax.plot(x, y, color=color)`    |
| `bar`       | x-axis categories                   | Required         | `ax.bar(x, y, color=color)`     |
| `scatter`   | x-axis values                       | Required         | `ax.scatter(x, y, color=color)` |
| `histogram` | distribution values                 | Not used         | `ax.hist(x, color=color)`       |
| `pie`       | slice values (or labels, see below) | Optional         | `ax.pie(...)`                   |
| `box`       | distribution values (NaNs dropped)  | Not used         | `ax.boxplot(x.dropna())`        |

### Pie chart note

Pie charts are handled a bit differently from the others: `x_column` supplies the numeric values for the slices, and the slice labels come from either `y_column` (if provided) or, if not, the DataFrame's row index (converted to strings). This is a deliberate accommodation for the fact that a pie chart doesn't map cleanly onto the generic "x vs y" idea used by the other chart types.

---

## Important Implementation Detail: the `"string"` Sentinel

You'll notice checks like this throughout the code:

```python
if config.title and config.title != 'string':
    ax.set_title(config.title)
```

**Why compare against the literal string `"string"`?**

When this endpoint is rendered in Swagger UI / OpenAPI docs (`/docs`), FastAPI auto-populates the example request body using the _type name_ of each field as a placeholder. Any `Optional[str]` field without an explicit `example` or `default` shows up pre-filled with the word `string` in the "Try it out" form.

If a user clicks "Execute" without editing these placeholder fields, the literal string `"string"` gets sent to the backend, not an empty value, not `None`, but the actual four-letter word `"string"`. Without the extra check, the API would happily set a chart title of `"string"`, an x-axis label of `"string"`, and so on.

The `!= 'string'` guard is a defensive workaround: it treats the unedited OpenAPI placeholder the same as if the field had been omitted, so the resulting chart falls back to sensible defaults (e.g., the column name) instead of literally displaying the word "string" as a label or title.

---

## Fallback Label Logic

Axis labels are resolved in two passes:

1. **Base fallback** — `x_column` and `y_column` are used as the default axis labels (again, guarded against the `"string"` placeholder).
2. **Explicit override** — if `x_label` / `y_label` / `title` are supplied (and aren't the `"string"` placeholder), they override the base fallback.

This means the effective priority order is:

```
x_label (if set and not "string")  >  x_column (if not "string")  >  unset
```

---

## Handling invalid values

Data can have invalid values or missing values. The code handles by asking the user what to do about those. If the asked chart type requires only one array, code simply removes them and sends a header telling that some values have been removed. For chart types that require more than one column, the application will send a response of 200 and ask user what to with those missing or invalid values. The user can specify what to do through `null_strategy` and `custom_fill_value` and the application acts accordingly.

### Code explanations

> Note: Both missing or invalid values have been referred to as invalid values only.

#### Checking for invalid values

```python
def _coerce_numeric(series: pd.Series) -> tuple[pd.Series, pd.Series]:
    """Returns (coerced_series, valid_mask). valid_mask is True where the
    value is both non-null AND numeric-parseable."""

    # converts a our column to numeric, coercing errors (missing or invalid values) to NaN. Then we can use the mask to drop or fill.
    coerced = pd.to_numeric(series, errors="coerce")

    # valid_mask is True where the value is not NaN (i.e., it was successfully coerced to a number)
    valid_mask = coerced.notna()
    return coerced, valid_mask
```

#### Applying strategy for invalid values

```python
def _apply_strategy(coerced: pd.Series, valid_mask: pd.Series, strategy: NullStrategy, custom_value: Optional[float]) -> pd.Series:
    """replaces missing values according to the specified strategy. If strategy is 'drop', this function does nothing; the caller should handle dropping rows."""

    if strategy == NullStrategy.zero:
        return coerced.fillna(0)
    if strategy == NullStrategy.mean:
        return coerced.fillna(coerced[valid_mask].mean())
    if strategy == NullStrategy.median:
        return coerced.fillna(coerced[valid_mask].median())
    if strategy == NullStrategy.custom:
        if custom_value is None:
            raise HTTPException(status_code=400, detail="custom_fill_value is required when null_strategy is 'custom'")
        return coerced.fillna(custom_value)
    # 'drop' is handled by the caller via masking, not fillna
    return coerced
```

`coerced[valid_mask]` takes only those values where `valid_mask` is true.
`.fillna` replaces `NaN`.

#### Handling in chart generation

For single column charts, application counts the number of missing values and generates charts of only valid values.

Counting of missing values:

```python
x_coerced, x_mask = _coerce_numeric(df[config.x_column])

# '~' reverses the booleans, true to false and false to true, then it simply counts all the true values.
removed = int((~x_mask).sum())
```

Finding valid values:

```python
# will only have those values which are true.
x_clean = x_coerced[x_mask]
```

A kind of similar strategy is applied for charts that require more than one column.

```python
x_invalid_count = int((~x_mask).sum())
y_invalid_count = int((~y_mask).sum())

# Rows that are invalid in exactly one column but not the other are the
# "misalignment" case — dropping each column independently would desync x/y.
combined_mask = x_mask & y_mask
only_x_invalid = int((~x_mask & y_mask).sum())
only_y_invalid = int((~y_mask & x_mask).sum())
misaligned = (only_x_invalid > 0) or (only_y_invalid > 0)
```

Above we are thinking of each row falling into one of the four categories: valid in both, invalid in both, invalid only in `x_column` or invalid only in `y_column`. The first two buckets are harmless, if a row is bad in both, dropping it won't do any harm. The problem is with the last two buckets. A row invalid only in `x` but valid in `y` means that if you dropped each column separately, you'd remove a row from x's array but keep the corresponding value in y's array, shifting everything out of alignment.

In such a case, we just ask the user what to do and plot chart accordingly. Handling of invalid values is same as for single value charts.

---

## Example Request

```http
POST /generate/abc123
Content-Type: application/json

{
  "chart_type": "bar",
  "x_column": "region",
  "y_column": "revenue",
  "color": "#4C9AFF",
  "title": "Revenue by Region",
  "x_label": "Region",
  "y_label": "Revenue (USD)",
  "null_strategy": "custom",
  "custom_fill_value": "2.0"
}
```

**Response:** `200 OK` with a PNG image body.

## Further reading

- [Fast API query Models](https://fastapi.tiangolo.com/tutorial/query-param-models)
- [Pandas - `pd.to_numeric`](https://pandas.pydata.org/docs/reference/api/pandas.to_numeric.html)
- [Pandas - `DataFrame.fillna`](https://pandas.pydata.org/docs/reference/api/pandas.DataFrame.fillna.html)
