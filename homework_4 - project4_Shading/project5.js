// This function takes the translation and two rotation angles (in radians) as input arguments.
// The two rotations are applied around x and y axes.
// It returns the combined 4x4 transformation matrix as an array in column-major order.
// You can use the MatrixMult function defined in project5.html to multiply two 4x4 matrices in the same format.
function GetModelViewMatrix( translationX, translationY, translationZ, rotationX, rotationY )
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
	//const mvp = MatrixMult(projectionMatrix, transmatrix);

	return transmatrix;
}


// [TO-DO] Complete the implementation of the following class.
var meshVS = `
    attribute vec3 pos;
    attribute vec2 txc;
    uniform mat4 mvp;
	uniform bool swapYZ;
    varying vec2 texCoord;

	//new part
	attribute vec3 normal;
	uniform mat4 mv;
    uniform mat3 normMatrix;
	varying vec3 fragNormal;
    varying vec3 fragPos;


    void main() {	
	    vec4 position;
		if (swapYZ) {
			position = vec4(pos.x, pos.z, pos.y, 1.0);
		}	
		else {
			position = vec4(pos.x, pos.y, pos.z, 1.0);		
		}
		gl_Position = mvp * position;	
		texCoord = txc;

		//new part
		fragPos = vec3(mv * position); //position in world coordinates
		fragNormal = normalize(normMatrix*normal);

    }
`;

var meshFS = `
    precision mediump float;
    uniform sampler2D tex;
    uniform bool useTexture;
    varying vec2 texCoord;

	//new part
	uniform vec3 lightDir;
    uniform float shininess;
	varying vec3 fragNormal;
    varying vec3 fragPos;


    void main() {
		vec3 N = normalize(fragNormal);
		vec3 L = normalize(lightDir);
		vec3 V = normalize(-fragPos);
		vec3 H = normalize(L + V);
		float diff = max(dot(N, L), 0.0);
		float spec = pow(max(dot(N, H), 0.0), shininess);
		vec3 Kd = useTexture ? texture2D(tex, texCoord).rgb : vec3(1.0);
        vec3 Ks = vec3(1.0);
		vec3 ambient = 0.1*Kd;
        vec3 color = ambient+diff*Kd+spec*Ks;
		gl_FragColor = vec4(color, 1.0);

        //if (useTexture) {
         //   gl_FragColor = texture2D(tex, texCoord);
        //} 
        //gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);

    }
`;

class MeshDrawer
{
	// The constructor is a good place for taking care of the necessary initializations.
	constructor()
	{
		// [TO-DO] initializations
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


		this.normBuffer = gl.createBuffer();
		this.normcoord = gl.getAttribLocation( this.prog, 'normal' ); //atributes-> change -> used for vertex position/colors
		gl.enableVertexAttribArray(this.normcoord);

		//TEXTURE PART
		this.useTexture = true; //texture is enabled by default
		this.textureloaded = false; //texture is not loaded by default
		
		//same steps as above for the texture coordinates
		this.texCoordBuffer = gl.createBuffer();
		this.texCoord = gl.getAttribLocation( this.prog, 'txc' );
		gl.enableVertexAttribArray(this.texCoord);


		//LIGHTING PART
		this.lightDirLoc = gl.getUniformLocation(this.prog, 'lightDir');
		this.shininessLoc = gl.getUniformLocation(this.prog, 'shininess');
		this.mvLoc = gl.getUniformLocation(this.prog, 'mv');
		this.normMatrixLoc = gl.getUniformLocation(this.prog, 'normMatrix');

	
	}
	
	// This method is called every time the user opens an OBJ file.
	// The arguments of this function is an array of 3D vertex positions,
	// an array of 2D texture coordinates, and an array of vertex normals.
	// Every item in these arrays is a floating point value, representing one
	// coordinate of the vertex position or texture coordinate.
	// Every three consecutive elements in the vertPos array forms one vertex
	// position and every three consecutive vertex positions form a triangle.
	// Similarly, every two consecutive elements in the texCoords array
	// form the texture coordinate of a vertex and every three consecutive 
	// elements in the normals array form a vertex normal.
	// Note that this method can be called multiple times.
	setMesh( vertPos, texCoords, normals )
	{
		// [TO-DO] Update the contents of the vertex buffer objects.
		this.numTriangles = vertPos.length / 3;

		//Update vertex buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertBuffer);
	    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertPos), gl.STATIC_DRAW);
		gl.vertexAttribPointer(this.vertPos, 3, gl.FLOAT, false, 0, 0);

		//Update normals buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
		gl.vertexAttribPointer(this.normcoord, 3, gl.FLOAT, false, 0, 0);
		//gl.enableVertexAttribArray(this.normcoord);


		//Update texture buffer
		gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texCoords), gl.STATIC_DRAW);
		gl.vertexAttribPointer(this.texCoord, 2, gl.FLOAT, false, 0, 0);

		//light part
	    this.normalBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);




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
	// The arguments are the model-view-projection transformation matrixMVP,
	// the model-view transformation matrixMV, the same matrix returned
	// by the GetModelViewProjection function above, and the normal
	// transformation matrix, which is the inverse-transpose of matrixMV.
	draw( matrixMVP, matrixMV, matrixNormal )
	{
		// [TO-DO] Complete the WebGL initializations before drawing
		gl.useProgram( this.prog );

		// Assign a value to the uniform variable in the vertex shader (transformation matrix) 
		gl.uniformMatrix4fv(this.mvp, false, matrixMVP);   
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
		

        //light part
		gl.bindBuffer(gl.ARRAY_BUFFER, this.normBuffer);
		gl.vertexAttribPointer(this.normcoord, 3, gl.FLOAT, false, 0, 0);


		//gl.uniformMatrix4fv(this.mvp, false, matrixMVP);
		gl.uniformMatrix4fv(this.mvLoc, false, matrixMV);
		gl.uniformMatrix3fv(this.normMatrixLoc, false, matrixNormal);


		//draw the triangles
		gl.drawArrays( gl.TRIANGLES, 0, this.numTriangles );

	}
	
	// This method is called to set the texture of the mesh.
	// The argument is an HTML IMG element containing the texture data.
	setTexture( img )
	{
		// [TO-DO] Bind the texture

		// You can set the texture image data using the following command.
		//gl.texImage2D( gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, img );

		// [TO-DO] Now that we have a texture, it might be a good idea to set
		// some uniform parameter(s) of the fragment shader, so that it uses the texture.

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
	
	// This method is called to set the incoming light direction
	setLightDir( x, y, z )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the light direction.
		gl.useProgram(this.prog);
		gl.uniform3fv(this.lightDirLoc, [x, y, z]);
		
	}
	
	// This method is called to set the shininess of the material
	setShininess( shininess )
	{
		// [TO-DO] set the uniform parameter(s) of the fragment shader to specify the shininess.
		gl.useProgram(this.prog);
		gl.uniform1f(this.shininessLoc, shininess);
		
	}
}
