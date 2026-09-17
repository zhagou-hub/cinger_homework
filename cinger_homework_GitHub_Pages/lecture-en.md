# Chapter 6: Page Layout — Principles to Practice

This chapter treats layout not as a list of CSS properties, but as a system for turning content into a reading path. Establish hierarchy, relationships, and rhythm first; then choose normal flow, Flexbox, Grid, media queries, or container queries to implement that intent.

## 6.1 Layout Before Code

Before coding, answer three questions: What should users notice first? Which items belong together? What should users do next? These correspond to visual hierarchy, proximity, and action path.

Five actionable principles:

1. **Hierarchy**: express importance with size, weight, color, and space.
2. **Alignment**: share a small set of baselines to reduce visual noise.
3. **Proximity**: spacing within a group should be smaller than spacing between groups.
4. **Repetition**: repeat spacing, radii, and color roles to form a system.
5. **Whitespace**: use empty space to group and focus instead of filling every area.

Key implementation: use CSS custom properties for spacing, type, radius, and measure tokens; use `clamp()` for fluid sizing; constrain reading width with `ch`.

## 6.2 Normal Flow and the Box Model

Normal flow is already responsive: blocks stack, inline content wraps, and content determines container height. Real copy is unpredictable and translations have different lengths, so avoid locking content with fixed heights and absolute positioning.

Use this globally:

```css
*, *::before, *::after { box-sizing: border-box; }
```

Prefer `min-height`, `max-inline-size`, `gap`, and logical properties. A shell such as `inline-size: min(100% - 2rem, 72rem)` preserves narrow-screen gutters while limiting wide-screen measure.

## 6.3 Flexbox for One Dimension

Flexbox fits problems that mainly live on one axis: navigation, toolbars, form rows, tag groups, and media objects. `flex-direction` defines the main axis, `justify-content` distributes free space along it, and `align-items` handles the cross axis.

A common wrapping card row:

```css
.card-row {
  display: flex;
  flex-wrap: wrap;
  gap: 1.5rem;
}
.card { flex: 1 1 16rem; min-inline-size: 0; }
```

`gap` appears only between items; `min-inline-size: 0` keeps long content from forcing flex items to overflow.

## 6.4 Grid for Two Dimensions

Use Grid when rows and columns must be planned together or regions need shared grid lines. A page-level Grid can relate header, sidebar, main, and footer while individual components still use Flexbox.

Named areas express layout intent. An adaptive card grid can use:

```css
.gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 16rem), 1fr));
  gap: 1.5rem;
}
```

## 6.5 Responsive Is Not Shrinking

Responsive design rearranges content priority and component relationships. Let content trigger breakpoints: change structure when navigation crowds, line length becomes awkward, or cards fall below their viable width.

Prefer `min()`, `max()`, `clamp()`, wrapping, and adaptive Grid for continuous change; use media queries for page-level changes and container queries for component-level changes. Mobile-first means securing a logical narrow-screen DOM order before enhancing wide layouts.

## 6.6 Final Checks for a Resilient Page

Run at least six checks before shipping:

1. Navigate with keyboard only; focus always remains visible.
2. Zoom the browser to 200%; no content is lost.
3. Use wrapping headings, double-length copy, and longer button labels; the layout still works.
4. Drag continuously from 320px to wide screens.
5. Fail images; alternative text and structure still communicate meaning.
6. Enable reduced motion; core information remains available.

The final goal is: **visual order = DOM order = keyboard order**. Layout may change position, but it should not change meaning.

## Technical Boundary

- Plain HTML, CSS, and vanilla JavaScript only.
- No databases, APIs, authentication, or other backend services.
- Every demo runs live in the browser.

