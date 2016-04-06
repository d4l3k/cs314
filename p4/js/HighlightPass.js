HighlightPass = function () {
	var uniforms = {
		"tDiffuse":   { type: "t", value: null },
	};
	var highlightShader = new THREE.ShaderMaterial({
		uniforms: uniforms,
		vertexShader: [
			"varying vec2 vUv;",
			"void main() {",
				"vUv = uv;",
				"gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );",
			"}"
		].join( "\n" ),
		fragmentShader: document.getElementById("highlightFragmentShader").textContent,
	});

	this.material = highlightShader;
	this.uniforms = uniforms;

	this.enabled = true;
	this.needsSwap = true;
	this.renderToScreen = false;

	this.camera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1 );
	this.scene  = new THREE.Scene();

	this.quad = new THREE.Mesh( new THREE.PlaneBufferGeometry( 2, 2 ), null );
	this.scene.add( this.quad );
};

HighlightPass.prototype = {
	render: function ( renderer, writeBuffer, readBuffer, delta, maskActive ) {

		this.uniforms[ "tDiffuse" ].value = readBuffer;

		this.quad.material = this.material;

		if ( this.renderToScreen ) {
			renderer.render( this.scene, this.camera );
		} else {
			renderer.render( this.scene, this.camera, writeBuffer, true );
		}
	}
};
