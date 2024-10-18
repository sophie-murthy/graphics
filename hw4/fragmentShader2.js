let fragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec3 uCursor;
uniform float uFL;
uniform vec3 uL[2];
uniform mat4 uA[6], uB[6], uC[6];

varying vec3 vPos;

vec3 bgColor = vec3(0.,0.,.05);
const float epsilon = 0.001;


vec2 rayQ(vec3 V, vec3 W, mat4 Q) {
    float a = Q[0][0]; float b = Q[1][1]; float c = Q[2][2]; float d = Q[1][2] + Q[2][1];
    float e = Q[0][2] + Q[2][0]; float f = Q[0][1] + Q[1][0]; float g = Q[0][3] + Q[3][0]; float h = Q[1][3] + Q[3][1];
    float i = Q[2][3] + Q[3][2]; float j = Q[3][3];
    float A = a * W.x * W.x + b * W.y * W.y + c * W.z * W.z + d * W.y * W.z + e * W.z * W.x + f * W.x * W.y;
    float B = 2.0 * (a * V.x * W.x + b * V.y * W.y + c * V.z * W.z) + d * (V.y * W.z + V.z * W.y) + e * (V.z * W.x + V.x * W.z) + f * (V.x * W.y + V.y * W.x) + g * W.x + h * W.y + i * W.z;
    float C = a * V.x * V.x + b * V.y * V.y + c * V.z * V.z + d * V.y * V.z + e * V.z * V.x + f * V.x * V.y + g * V.x + h * V.y + i * V.z + j;

    float discriminant = (B * B - 4.0 * A * C);

    if (discriminant < 0.0 || abs(A) < 1e-6) return vec2(-1.0, -1.0);
    
    float sqrtDisc = sqrt(discriminant);
    float t1 = (-B - sqrtDisc) / (2.0 * A);
    float t2 = (-B + sqrtDisc) / (2.0 * A);

    if (t1 > t2) {
        float temp = t1;
        t1 = t2;
        t2 = temp;
    }

    return vec2(t1, t2);
}

vec3 computeNormal(vec3 P, mat4 Q) {
    float x = P.x, y = P.y, z = P.z;

    float a = Q[0][0];
    float b = Q[1][1];
    float c = Q[2][2];
    float d = Q[1][2] + Q[2][1];
    float e = Q[0][2] + Q[2][0];
    float f = Q[0][1] + Q[1][0];
    float g = Q[0][3] + Q[3][0];
    float h = Q[1][3] + Q[3][1];
    float i = Q[2][3] + Q[3][2];

    vec3 N = vec3(
        2.0 * a * x + e * z + f * y + g,
        2.0 * b * y + d * z + f * x + h,
        2.0 * c * z + d * y + e * x + i
    );

    return normalize(N);
}

mat3 rayQ3(vec3 V, vec3 W, mat4 A, mat4 B, mat4 C, int inOut) {
    vec2 tA = rayQ(V, W, A);
    vec2 tB = rayQ(V, W, B);
    vec2 tC = rayQ(V, W, C);
    float tIn = max(max(tA.x, tB.x), tC.x);
    tIn = max(tIn, 0.0);
    float tOut = min(min(tA.y, tB.y), tC.y);

    if (tIn > tOut || tOut < 0.0) return mat3(vec3(-1.0), vec3(0.0), vec3(0.0));;

    float t = inOut == 0 ? tIn : tOut;

    vec3 P = V + t * W;

    vec3 N_A = computeNormal(P, A);
    vec3 N_B = computeNormal(P, B);
    vec3 N_C = computeNormal(P, C);

    vec3 N = normalize(N_A + N_B + N_C);
    return mat3(vec3(tIn, tOut, 0.0), P, N);
}


void main() {
    vec3 V = vec3(0.0, 0.0, 3.0);
    vec3 W = normalize(vec3(vPos.xy, -uFL)); 
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));
    vec3 color = bgColor;  

    //vec3 material, highlight;
    //float power;
    vec3 N, P, R;
    bool inShadow = false;
    //float tMin = 1000.0;
    mat3 material, highlight;
    mat3 material2, highlight2;
    vec3 power, power2;
    material[0] = vec3(.5,.17,0.);
    material[1] = vec3(0.6, 0.1, 0.1);
    material[2] = vec3(0.1, 0.1, 0.6);
    material2[0] = vec3(0.1, 0.4, 0.1);
    material2[1] = vec3(0.75, 0.75, 0.75);
    material2[2] = vec3(0.5, 0.1, 0.6);
    highlight[0] = 1.2 * material[0];
    highlight[1] = vec3(0.8, 0.2, 0.2);
    highlight[2] = vec3(0.3, 0.3, 1.0);
    highlight2[0] = vec3(0.2, 0.6, 0.2);
    highlight2[1] = vec3(0.9, 0.9, 0.9);
    highlight2[2] = vec3(0.7, 0.3, 0.8);
    power[0] = 8.0;
    power[1] = 32.0;
    power[2] = 64.0;
    power2[0] = 32.0;
    power2[1] = 64.0;
    power2[2] = 32.0;

    for (int i = 0; i < 6; i++) {
        
        float tMin = 500.0;
        mat3 result = rayQ3(V, W, uA[i], uB[i], uC[i], 0);
        float tIn = result[0][0]; 
        P = result[1];  
        N = result[2];
        R = W - 2.0 * dot(W, N) * N;

        if (tIn > 0.0 && tIn < tMin) {
            tMin = tIn;

            vec3 diffuse, specular;
            if (i < 3) {
                diffuse = material[i] * max(dot(N, L), 0.0);
                specular = highlight[i] * pow(max(dot(R, L), 0.0), power[i]);
            } else {
                diffuse = material2[i-3] * max(dot(N, L), 0.0);
                specular = highlight2[i-3] * pow(max(dot(R, L), 0.0), power2[i-3]);
            }   
            specular = clamp(specular, 0.0, 1.0);
            //color += diffuse + specular;
            color = diffuse + specular;

            vec3 P_offset = P + epsilon * R;
            vec3 reflectedColor = bgColor;

            for (int j = 0; j < 6; j++) {
                if (j != i) {
                    mat3 reflectedResult = rayQ3(P_offset, R, uA[j], uB[j], uC[j], 0);
                    float tReflected = reflectedResult[0][0];

                    if (tReflected > 0.0) {
                        vec3 P_reflected = reflectedResult[1];
                        vec3 N_reflected = reflectedResult[2];
                        // vec3 R_reflected = R - 2.0 * dot(R, N_reflected) * N_reflected;
                        vec3 R_reflected = W - 2.0 * dot(W, N_reflected) * N_reflected;
                        reflectedColor = bgColor;
                        for (int k = 0; k < 6; k++) {
                            if (k != j) {
                                mat3 shadowResult = rayQ3(P_reflected, R_reflected, uA[k], uB[k], uC[k], 0);
                                float tShadow = shadowResult[0][0];
                                if (tShadow > 0.0) {
                                    inShadow = true;
                                }
                            }
                        }

                        if (!inShadow) {
                            vec3 diffuse, specular;
                            if (j < 3) {
                                diffuse = material[j] * max(dot(N_reflected, L), 0.0);
                                specular = highlight[j] * pow(max(dot(R_reflected, L), 0.0), power[j]);
                            } else {
                                diffuse = material2[j-3] * max(dot(N_reflected, L), 0.0);
                                specular = highlight2[j-3] * pow(max(dot(R_reflected, L), 0.0), power2[j-3]);
                            }
                            // vec3 diffuse = material[j] * max(dot(N_reflected, L), 0.0);
                            // vec3 specular = highlight[j] * pow(max(dot(R_reflected, L), 0.0), power[j]);
                            reflectedColor += diffuse + specular;
                        } 
                    }

                    mat3 shadowResult = rayQ3(P, L, uA[j], uB[j], uC[j], 0);
                    float tShadow = shadowResult[0][0];
                    if (tShadow > 0.0) {
                        inShadow = true;
                    }
                }
            }

            if (!inShadow) {

                vec3 diffuse, specular;
                if (i < 3) {
                    diffuse = material[i] * max(dot(N, L), 0.0);
                    specular = highlight[i] * pow(max(dot(R, L), 0.0), power[i]);
                } else {
                    diffuse = material2[i-3] * max(dot(N, L), 0.0);
                    specular = highlight2[i-3] * pow(max(dot(R, L), 0.0), power2[i-3]);
                }
                // vec3 diffuse = material[i] * max(dot(N, L), 0.0);
                // vec3 specular = highlight[i] * pow(max(dot(R, L), 0.0), power[i]);
                color += diffuse + specular;
            } 

            color = mix(color, reflectedColor, 0.5);
        }
    }

    gl_FragColor = vec4(sqrt(color), 1.0);  // Final color
}


`;