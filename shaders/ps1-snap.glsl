// PS1-style vertex snapping: rounds each vertex to a coarse screen grid
// so polygons wobble slightly as the camera moves. Injected right after
// three.js computes gl_Position.
gl_Position.xy = floor(gl_Position.xy / gl_Position.w * vec2(240.0, 150.0) + 0.5) / vec2(240.0, 150.0) * gl_Position.w;
