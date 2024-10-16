let value = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

// function multiply(matrix1, matrix2) {
//     let result = [];
//     for (let i = 0; i < 4; i++) {
//         for (let j = 0; j < 4; j++) {
//             let sum = 0;
//             for (let k = 0; k < 4; k++) {
//                 sum += matrix1[i * 4 + k] * matrix2[k * 4 + j];
//             }
//             result.push(sum);
//         }
//     }
//     return result;
// }

function multiply(matrix1, matrix2) {
    let result = new Array(16).fill(0);
    for (let i = 0; i < 4; i++) {        
        for (let j = 0; j < 4; j++) {   
            let sum = 0;
            for (let k = 0; k < 4; k++) {
                sum += matrix1[i + k * 4] * matrix2[k + j * 4];
            }
            result[i + j * 4] = sum;
        }
    }
    return result;
}


function translation(x, y, z) {
    return multiply(value, [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
}

function rotationX(angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);
    return multiply(value, [1,0,0,0, 0,c,-s,0, 0,s,c,0, 0,0,0,1]);
}

function rotationY(angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);
    return multiply(value, [c,0,s,0, 0,1,0,0, -s,0,c,0, 0,0,0,1]);
}

function rotationZ(angle) {
    let c = Math.cos(angle);
    let s = Math.sin(angle);
    return multiply(value, [c,-s,0,0, s,c,0,0, 0,0,1,0, 0,0,0,1]);
}

function scale(x, y, z) {
    return multiply(value, [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
}


function transpose(m) {
    return [
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15]
    ];
}
