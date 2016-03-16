varying vec3 interpolatedNormal;
varying vec3 vertPos;
varying vec3 lightPos;
varying vec3 cameraPos;

uniform vec3 lightColor;
uniform vec3 ambientColor;

const vec3 cwarm = vec3(0.8, 0.3, 0.3);
const vec3 ccold = vec3(0.3, 0.3, 0.8);

void main() {

    vec3 l = normalize(lightPos - vertPos);
    vec3 n = normalize(interpolatedNormal);

    float kw = (1.0 + dot(n, l))/2.0;

    vec3 eyeDir = normalize(cameraPos-vertPos);

    vec3 c = kw * cwarm + (1.0-kw) * ccold;

    if (dot(n, eyeDir) <= 0.3) {
      gl_FragColor = vec4(0,0,0,1.0);
    } else {
      gl_FragColor = vec4(c, 1.0);
    }
}
