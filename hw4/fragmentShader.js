let fragmentShader = `
precision mediump float;

uniform float uTime;
uniform vec3 uCursor;
uniform float uFL;
uniform vec3 uL[2];
uniform mat4 uA[6], uB[6], uC[6];

varying vec3 vPos;

vec3 bgColor = vec3(0.,0.,.05);


vec2 rayQ(vec3 V, vec3 W, mat4 Q) {
    float a = Q[0][0]; float b = Q[1][1]; float c = Q[2][2]; float d = Q[1][2] + Q[2][1];
    float e = Q[0][2] + Q[2][0]; float f = Q[0][1] + Q[1][0]; float g = Q[0][3] + Q[3][0]; float h = Q[1][3] + Q[3][3];
    float i = Q[2][3] + Q[3][2]; float j = Q[3][3];
    float A = a * W.x * W.x + b * W.y * W.y + c * W.z * W.z + d * W.y * W.z + e * W.z * W.x + f * W.x * W.y;
    float B = 2.0 * (a * V.x * W.x + b * V.y * W.y + c * V.z * W.z + d * (V.y * W.z + V.z * W.y) + e * (V.z * W.x + V.x * W.z) + f * (V.x * W.y + V.y * W.x));
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
    float tOut = min(min(tA.y, tB.y), tC.y);

    //if (tIn > tOut || tOut < 0.0) return mat3(-1.0);

    float t = inOut == 0 ? tIn : tOut;

    vec3 P = V + t * W;

    vec3 N_A = computeNormal(P, A);
    vec3 N_B = computeNormal(P, B);
    vec3 N_C = computeNormal(P, C);

    vec3 N = normalize(N_A + N_B + N_C);
    return mat3(vec3(tIn, tOut, 0.0), P, N);
}


void main() {
    vec3 V = vec3(0.0, 0.0, 25.0);
    vec3 W = normalize(vec3(vPos.xy, -uFL)); 
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));
    vec3 color = bgColor;  

    vec3 material, highlight;
    float power;
    vec3 N, P, R;
    bool inShadow = false;
    float tMin = 1000.0;
    

    for (int i = 0; i < 6; i++) {
        if (i == 1) {
            mat4 A = mat4(1.0);
            // A[3][0] = 1.0;
            // A[3][1] = -1.0;
            // A[3][2] = 1.0;
            // A[1][3] = 1.0;
            // A[2][3] = -1.0;
            A[3][3] = -0.3;
            A[1][1] = 0.0;

            vec2 t = rayQ(V, W, A); 
            float tIn = t.x;
            P = V + tIn * W;
            N = computeNormal(P, A);
            R = W - 2.0 * dot(W, N) * N;

            if (tIn > 0.0 && tIn < tMin) {
                tMin = tIn;
                material = vec3(1.0, 0.0, 0.0);  // Red
                highlight = vec3(1.0, 0.6, 0.6);
                color = 0.3 * material + max(0., dot(N, L));
            }
        
        } if (i == 2) {
            mat4 B = mat4(1.0);
            B[3][3] = -0.3;
            B[0][0] = 0.0;

            vec2 t = rayQ(V, W, B); 
            float tIn = t.x;
            P = V + tIn * W;
            N = computeNormal(P, B);
            R = W - 2.0 * dot(W, N) * N;

            if (tIn > 0.0 && tIn < tMin) {
                tMin = tIn;
                material = vec3(0.0, 0.0, 1.0);  // Green
                highlight = vec3(0.6, 1.0, 0.6);
                color = 0.3 * material + max(0., dot(N, L));
            }
        } else {
            mat3 result = rayQ3(V, W, uA[i], uB[i], uC[i], 0);
            float tIn = result[0][0]; 
            P = result[1];  
            N = result[2];
            R = W - 2.0 * dot(W, N) * N;

            if (tIn > 0.0 && tIn < tMin) {
                tMin = tIn;
                
                if (i == 0) {
                    material = vec3(1.0, 0.5, 0.0);  // Orange
                    highlight = vec3(1.0, 0.6, 0.3);
                } else if (i == 1) {
                    material = vec3(0.0, 1.0, 0.0);  // Green
                    highlight = vec3(0.6, 1.0, 0.6);
                } else if (i == 2) {
                    material = vec3(0.0, 0.0, 1.0);  // Blue
                    highlight = vec3(0.6, 0.6, 1.0);
                } else {
                    material = vec3(0.8, 0.4, 0.1);  // brown
                    highlight = vec3(0.9, 0.6, 0.4);
                }

                
                color = 0.3 * material + max(0., dot(N, L));

                // for (int j = 0; j < 6; j++) {
                //     if (j != i) {
                //         mat3 shadowResult = rayQ3(P, L, uA[j], uB[j], uC[j], 0);
                //         float tShadow = shadowResult[0][0];
                //         if (tShadow > 0.0) {
                //             inShadow = true;
                //         }
                //     }
                // }

                // if (!inShadow) {
                //     vec3 diffuse = material * max(dot(N, L), 0.0);
                //     vec3 specular = highlight * pow(max(dot(R, W), 0.0), power);
                //     color += diffuse + specular;
                // } 
            }
        }
    }

    gl_FragColor = vec4(sqrt(color), 1.0);  // Final color
}


`;