// This function takes the projection matrix, the translation, and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// The given projection matrix is also a 4x4 matrix stored as an array in column-major order.
// You can use the MatrixMult function defined in project4.html to multiply two 4x4 matrices in the same format.
function GetModelViewProjection( projectionMatrix, translationX, translationY, translationZ, rotationX, rotationY )
{
	// [TO-DO] Modify the code below to form the transformation matrix.
	var trans = [
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		translationX, translationY, translationZ, 1
	];
	//Rotation matrix around X
	const RMX = [
		1, 0, 0, 0,
		0, Math.cos(rotationX), Math.sin(rotationX), 0,
		0, -Math.sin(rotationX), Math.cos(rotationX), 0,
		0, 0, 0, 1
	];

	//Rotation matrix around Y
	const RMY = [
		Math.cos(rotationY), 0, -Math.sin(rotationY), 0,
		0, 1, 0, 0,
		Math.sin(rotationY), 0, Math.cos(rotationY), 0,
		0, 0, 0, 1
	];
	//Final rotation matrix
	var RM=MatrixMult(RMY, RMX);

	//Final transformation matrix: Translation*Rotation
	const transmatrix = MatrixMult(trans, RM);

	// Multiply with the projection matrix: Projection*transmatrix
	const mvp = MatrixMult(projectionMatrix, transmatrix);

	return mvp;
}


// [TO-DO] Complete the implementation of the following class.
var meshVS = `
    attribute vec3 pos;
    attribute vec2 txc;
    uniform mat4 mvp;
	uniform bool swapYZ;
    varying vec2 texCoord;
    void main() {	
		if (swapYZ) {
			gl_Position = mvp * vec4(pos.x, pos.z, pos.y, 1.0);
		}	
		else {
			gl_Position = mvp * vec4(pos.x, pos.y, pos.z, 1.0);		
		}	
		texCoord = txc;
    }
`;

var meshFS = `
    precision mediump float;
    uniform sampler2D tex;
    uniform bool useTexture;
    varying vec2 texCoord;
    void main() {
        if (useTexture) {
            gl_FragColor = texture2D(tex, texCoord);
        } else {
            gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
        }
    }
`;

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
		this.numTriangles = 0;
		

		//function from html file to inizitialize the shader program
		this.prog = InitShaderProgram(meshVS, meshFS); 
		gl.useProgram(this.prog);

		//RENDERING PART
		// 1) createBuffer that contains data on GPU (constructor)
		// 2) bind it with bindBuffer (setMesh, draw)
		// 3) load them with bufferData (setMesh, draw)
		this.vertBuffer = gl.createBuffer();

		// In the shaders we use attributes to receives data from the buffer:
		// 1) get the attribute position from the shader (getUniformLocation) (constructor)
		// 2) enable the attribute (enableVertexAttribArray) (constructor)
		// 3) set the attribute pointer (vertexAttribPointer) (setMesh)
		this.vertPos = gl.getAttribLocation( this.prog, 'pos' ); //atributes-> change -> used for vertex position/colors
		gl.enableVertexAttribArray(this.vertPos);

		// 4) get the uniform position from the shader (getUniformLocation) (constructor)
		// 5) set the uniform value (uniformMatrix4fv) (draw)
		this.mvp = gl.getUniformLocation( this.prog, 'mvp' ); //uniform=do not change -> used fot transformation matrix
		this.swapYZLoc = gl.getUniformLocation(this.prog, 'swapYZ'); //uniform location for swapYZ	

		//TEXTURE PART
		this.useTexture = true; //texture is enabled by default
		this.textureloaded = false; //texture is not loaded by default
		
		//same steps as above for the texture coordinates
		this.texCoordBuffer = gl.createBuffer();
		this.texCoord = gl.getAttribLocation( this.prog, 'txc' );
		gl.enableVertexAttribArray(this.texCoord);
	}

		
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions
	// and an array of 2D texture coordinates.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex.
	// Note that this method can be called multiple times.
	setMesh(vertPos, texCoords) {
		this.numTriangles = vertPos.length / 3;

		//Update vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);

		//Update texture buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);

	}

	// This method is called when the user changes the state of the
	// "Swap Y-Z Axes" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	swapYZ( swap )
	{
		// [TO-DO] Set the uniform parameter(s) of the vertex shader
		gl.useProgram(this.prog);
		gl.uniform1i(this.swapYZLoc, swap); //this.swapYZLoc->location, swap-> value (true/false)
	}
	
	// This method is called to draw the triangular mesh.
	// The argument is the transformation matrix, the same matrix returned
	// by the GetModelViewProjection function above.
	draw( trans )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		 // Assign a value to the uniform variable in the vertex shader (transformation matrix) 
		 gl.uniformMatrix4fv(this.mvp, false, trans);   //this.mvp->location, trans-> matrix components

		 // Enable vertex buffer
		 gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
		 gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);
		 
		 // Enable texture buffer
		 gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		 gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);
		 
		 //enable the use of texture
		 if (this.useTexture && this.textureloaded) { //show texture only if it is loaded, otherwise the object will be black
            gl.uniform1i(gl.getUniformLocation(this.prog, 'useTexture'), true);
        }
		else {
			gl.uniform1i(gl.getUniformLocation(this.prog, 'useTexture'), false);
		}
		
		//draw the triangles
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );


	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture
		const tex = gl.createTexture();
		gl.bindTexture( gl.TEXTURE_2D, tex );
		// You can set the texture image data using the following command.
		gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );
		this.textureloaded = true; //the texture is laoded
		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.
        gl.texParameteri( gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST );
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
        gl.generateMipmap(gl.TEXTURE_2D);
	}
	
	// This method is called when the user changes the state of the
	// "Show Texture" checkbox. 
	// The argument is a boolean that indicates if the checkbox is checked.
	showTexture( show )
	{	
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify if it should use the texture.
		if(!show) {
			this.useTexture = false;
		}
		else {
			this.useTexture = true;
		}
	}
	
	
}
