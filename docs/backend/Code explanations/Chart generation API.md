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

| Field        | Type        | Required      | Default  | Description                                                                                                       |
| ------------ | ----------- | ------------- | -------- | ----------------------------------------------------------------------------------------------------------------- |
| `chart_type` | `ChartType` | Yes           | -        | One of `line`, `bar`, `scatter`, `histogram`, `pie`, `box`.                                                       |
| `x_column`   | `string`    | Yes           | -        | Column used for the x-axis (or as the primary data column for single-column chart types).                         |
| `y_column`   | `string`    | Conditionally | `None`   | Column used for the y-axis. Required for `line`, `bar`, and `scatter`. Ignored for `histogram`, `pie`, and `box`. |
| `color`      | `string`    | No            | `"None"` | Hex (`#FF5733`) or named (`"blue"`) color for the chart elements.                                                 |
| `title`      | `string`    | No            | `None`   | Chart title.                                                                                                      |
| `x_label`    | `string`    | No            | `None`   | Overrides the x-axis label (defaults to `x_column` if not set).                                                   |
| `y_label`    | `string`    | No            | `None`   | Overrides the y-axis label (defaults to `y_column` if not set).                                                   |

#### `ChartType` enum

```python
line | bar | scatter | histogram | pie | box
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
  "y_label": "Revenue (USD)"
}
```

**Response:** `200 OK` with a PNG image body.

## Further reading

- [Fast API query Models](https://fastapi.tiangolo.com/tutorial/query-param-models)
