varying vec3 interpolatedColor;

uniform vec3 lightColor;
uniform vec3 ambientColor;
uniform vec3 lightPosition;

const vec3 color = vec3(0.5, 0.5, 0.5);
const float kse = 10.0;

void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    vec4 vertPos4 = modelViewMatrix * vec4(position, 1.0);
    vec3 vertPos = vec3(vertPos4) / vertPos4.w;

    vec4 lightPos4 = viewMatrix * vec4(lightPosition, 1.0);
    vec3 lightPos = vec3(lightPos4) / lightPos4.w;

    vec4 cameraPos4 = viewMatrix * vec4(cameraPosition, 1.0);
    vec3 cameraPos = vec3(cameraPos4) / cameraPos4.w;

    vec3 l = normalize(lightPos - vertPos);
    vec3 n = normalize(normalMatrix * normal);
    vec3 diffuse = color * lightColor * dot(n, l);

    vec3 reflectDir = normalize(reflect(-l, n));
    //vec3 reflectDir = 2.0*n*dot(n, l) - l;
    vec3 eyeDir = normalize(cameraPos-vertPos);
    // specular color is 1,1,1 so omitted
    vec3 specular = lightColor * pow(dot(eyeDir, reflectDir), kse);

    float hidden = max(dot(l,n), 0.0);

    interpolatedColor = ambientColor*color + hidden*diffuse + hidden*specular;
}
