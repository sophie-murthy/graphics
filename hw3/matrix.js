function Matrix() {
    this.identity = () => value = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];
    this.translate   = (x,y,z) => value = multiply(value, [1,0,0,0, 0,1,0,0, 0,0,1,0, x,y,z,1]);
    this.rotateX     = theta   => value = multiply(value, [1,0,0,0, 0,Math.cos(theta),-Math.sin(theta),0, 0,Math.sin(theta),Math.cos(theta),0, 0,0,0,1]);
    this.rotateY     = theta   => value = multiply(value, [Math.cos(theta),0,Math.sin(theta),0, 0,1,0,0, -Math.sin(theta),0,Math.cos(theta),0, 0,0,0,1]);
    this.rotateZ     = theta   => value = multiply(value, [Math.cos(theta),-Math.sin(theta),0,0, Math.sin(theta),Math.cos(theta),0,0, 0,0,1,0, 0,0,0,1]);
    this.scale       = (x,y,z) => value = multiply(value, [x,0,0,0, 0,y,0,0, 0,0,z,0, 0,0,0,1]);
    this.perspective = (x,y,z) => value = multiply(value, [1,0,0,x, 0,1,0,y, 0,0,1,z, 0,0,0,1]);
    this.get = () => value;
    this.set = v => value = v;
    this.transform = vector => {
        let result = [];
        for (let i = 0; i < vector.length; i += 4) {
            let x = vector[i], y = vector[i + 1], z = vector[i + 2], w = vector[i + 3];
            for (let j = 0; j < 4; j++) {
                result.push(value[j] * x + value[j + 4] * y + value[j + 8] * z + value[j + 12] * w);
            }
        }
        return result;
    }

    let value = [1,0,0,0, 0,1,0,0, 0,0,1,0, 0,0,0,1];

    let multiply = (matrix1,matrix2) => {
        let result = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                let sum = 0;
                for (let k = 0; k < 4; k++) {
                    sum += matrix1[i * 4 + k] * matrix2[k * 4 + j];
                }
                result.push(sum);
            }
        }
        return result;
    }
 }

