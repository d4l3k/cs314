varying vec3 interpolatedNormal;
varying vec3 vertPos;
varying vec3 lightPos;
varying vec3 cameraPos;

uniform vec3 lightColor;
uniform vec3 ambientColor;

const vec3 color = vec3(0.5, 0.5, 0.5);
const float kse = 10.0;

void main() {

    vec3 l = normalize(lightPos - vertPos);
    vec3 n = normalize(interpolatedNormal);
    vec3 diffuse = color * lightColor * dot(n, l);

    vec3 reflectDir = normalize(reflect(-l, n));
    //vec3 reflectDir = 2.0*n*dot(n, l) - l;
    vec3 eyeDir = normalize(cameraPos-vertPos);
    // specular color is 1,1,1 so omitted
    // vec3 specular = lightColor * pow(dot(eyeDir, reflectDir), kse);
    vec3 h = (l + eyeDir)/2.0;
    vec3 specular = lightColor * pow(dot(h, n), kse);
    float hidden = max(dot(l,n), 0.0);

    vec3 c = ambientColor*color + hidden*diffuse + hidden*specular;
    gl_FragColor = vec4(c, 1.0);
}
