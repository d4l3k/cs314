varying vec3 interpolatedColor;

void main() {
  gl_FragColor = vec4(interpolatedColor, 1.0);
}
