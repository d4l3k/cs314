varying vec3 interpolatedNormal;
varying vec3 vertPos;
varying vec3 lightPos;

uniform vec3 lightPosition;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);

    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
    vertPos = vec3(vertPos4) / vertPos4.w;

    vec4 lightPos4 = viewMatrix * vec4(lightPosition, 1.0);
    lightPos = vec3(lightPos4) / lightPos4.w;

    interpolatedNormal = normalMatrix * normal;
}
