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
    float e = Q[0][2] + Q[2][0]; float f = Q[0][1] + Q[1][0]; float g = Q[0][3] + Q[3][0]; float h = Q[1][3] + Q[3][1];
    float i = Q[2][3] + Q[3][2]; float j = Q[3][3];
    float A = a * W.x * W.x + b * W.y * W.y + c * W.z * W.z + d * W.y * W.z + e * W.z * W.x + f * W.x * W.y;
    float B = 2.0 * (a * V.x * W.x + b * V.y * W.y + c * V.z * W.z) + d * (V.y * W.z + V.z * W.y) + e * (V.z * W.x + V.x * W.z) + f * (V.x * W.y + V.y * W.x) + g * W.x + h * W.y + i * W.z;
    float C = a * V.x * V.x + b * V.y * V.y + c * V.z * V.z + d * V.y * V.z + e * V.z * V.x + f * V.x * V.y + g * V.x + h * V.y + i * V.z + j;

    float discriminant = (B * B - 4.0 * A * C);

    if (discriminant < 0.0) return vec2(-1.0, -1.0);
    
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
    int matrixHitIn = 0;
    float tIn = tA.x;
    if (tB.x > tIn) {
        tIn = tB.x;
        matrixHitIn = 1;
    }
    if (tC.x > tIn) {
        tIn = tC.x;
        matrixHitIn = 2;
    }
    int matrixHitOut = 0;
    float tOut = tA.y;
    if (tB.y < tOut) {
        tOut = tB.y;
        matrixHitOut = 1;
    }
    if (tC.y < tOut) {
        tOut = tC.y;
        matrixHitOut = 2;
    }

    if (tIn > tOut || tOut < 0.0) return mat3(vec3(-1.0), vec3(0.0), vec3(0.0));;

    vec3 PA, PB, PC;

    for (int i = 0; i < 3; i++) {
        if (inOut == 0) {
            PA = V + tA.x * W;
            PB = V + tB.x * W;
            PC = V + tC.x * W;
        } else {
            PA = V + tA.y * W;
            PB = V + tB.y * W;
            PC = V + tC.y * W;
        }
    }
    
    vec3 P;
    for (int i = 0; i < 3; i++) {
        if (matrixHitIn == 0) {
            P = PA;
        } else if (matrixHitIn == 1) {
            P = PB;
        } else {
            P = PC;
        }
    }

    vec3 N;
    for (int i = 0; i < 3; i++) {
        if (matrixHitIn == 0) {
            N = computeNormal(P, A);
        } else if (matrixHitIn == 1) {
            N = computeNormal(P, B);
        } else {
            N = computeNormal(P, C);
        }
    }
    return mat3(vec3(tIn, tOut, 0.0), P, N);
}


void main() {
    vec3 V = vec3(0.0, 0.0, 3.0);
    vec3 W = normalize(vec3(vPos.xy, -uFL)); 
    vec3 L = normalize(vec3(1.0, 1.0, 1.0));
    vec3 color = bgColor;  

    vec3 material, highlight;
    float power;
    vec3 N, P, R;
    bool inShadow = false;
    

    for (int i = 0; i < 6; i++) {
        
        float tMin = 100.0;
        mat3 result = rayQ3(V, W, uA[i], uB[i], uC[i], 0);
        float tIn = result[0][0]; 
        P = result[1];  
        N = result[2];
        R = W - 2.0 * dot(W, N) * N;

        if (tIn > 0.0 && tIn < tMin) {
            tMin = tIn;
            
            material = vec3(.5,.17,0.);
            highlight = 1.2 * material;
            power = 8.;
            color = 0.3 * material;

            for (int j = 0; j < 6; j++) {
                if (j != i) {
                    mat3 shadowResult = rayQ3(P, L, uA[j], uB[j], uC[j], 0);
                    float tShadow = shadowResult[0][0];
                    if (tShadow > 0.0) {
                        inShadow = true;
                    }
                }
            }

            if (!inShadow) {
                vec3 diffuse = material * max(dot(N, L), 0.0);
                vec3 specular = highlight * pow(max(dot(R, L), 0.0), power);
                color += diffuse + specular;
            } 
        }
    }

    gl_FragColor = vec4(sqrt(color), 1.0);  
}


`;