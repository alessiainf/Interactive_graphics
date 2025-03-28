// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	//converte degrees in radiant
	rotation = rotation * Math.PI / 180;

	//Scale factor is "scale"

	//define the rotation matrix
	//R=Array(Math.cos(rotation),-Math.sin(rotation),0,Math.sin(rotation),Math.cos(rotation),0,0,0,1);

	//define the translation matrix
	//T=Array(1,0,0q,0,1,0,positionX,positionY,1);

	//total matrix when applying scale, rotation and translation
	//R*S+T
	return Array( Math.cos(rotation)*scale, Math.sin(rotation)*scale, 0,
	-Math.sin(rotation)*scale,Math.cos(rotation)*scale, 0, 
	positionX, positionY, 1 );
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{
	var T= new Array(9);
	for (var i = 0; i < 3; i++) {
		for(var j = 0; j < 3; j++) {	
			T[i*3+j] = trans2[j+0] * trans1[i*3+0] //row*column
					+ trans2[j+3] * trans1[i*3+1]
					+ trans2[j+6] * trans1[i*3+2];
		}
	}
	return T;
	
}
