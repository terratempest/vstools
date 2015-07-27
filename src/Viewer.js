VSTOOLS.Viewer = function () {

	//

	var scene = this.scene = new THREE.Scene();
	var camera = new THREE.PerspectiveCamera( 75, 1, 0.1, 10000 );

	var renderer = new THREE.WebGLRenderer();

	resize();

	$( 'body' ).append( renderer.domElement );

	camera.position.z = 500;
	var orbitControls = new THREE.OrbitControls( camera, renderer.domElement );

	function render() {

		requestAnimationFrame( render );

		orbitControls.update();

		if ( skeletonHelper ) skeletonHelper.update();

		THREE.AnimationHandler.update( 0.01 );

		renderer.render( scene, camera );

	}

	function resize() {

		setTimeout( function () {

			camera.aspect =  ( window.innerWidth - $('#leftSidebar').width() - $('#sidebar').width() ) / window.innerHeight;
			camera.updateProjectionMatrix();
			renderer.setSize( ( window.innerWidth - $('#leftSidebar').width() - $('#sidebar').width() ), window.innerHeight );

		}, 1 );

	}

	$( window ).on( 'resize', resize );

	this.run = function () {

		render();

	};

	//

	var self = this;

	var root, activeSHP, activeSEQ, activeZND, skeletonHelper;

	// ui

	var $sidebar = $( '#sidebar' );
	var $leftSidebar = $( '#leftSidebar' );

	$sidebar.on( 'click', 'h2', function () {

		$( this ).toggleClass( 'collapsed' );

	} );

	$leftSidebar.on( 'click', 'h2', function() {

		$( this ).toggleClass( 'collapsed' );

	});

	var $file1 = $( '#file1' );
	var $file2 = $( '#file2' );
	var $fileAltDefault = $( '#fileAltDefault' );
	var $load = $( '#load' );
	var $files = $( '#files' );
	var $skeleton = $( '#skeleton' );
	var $textures = $( '#textures' );
	var $animation = $( '#animation' );
	var $animationCount = $( '#animationCount' );

	$sidebar.on( 'click', '#load', function(){
		load( $file1[ 0 ].files[ 0 ], $file2[ 0 ].files[ 0 ] );
	});

	$sidebar.on( 'click', '#next', nextAnim );
	$sidebar.on( 'click', '#prev', prevAnim );

	$sidebar.on( 'change', '#animation', updateAnim );

	$sidebar.on( 'click', '#exportOBJ', exportOBJ );
	$sidebar.on( 'click', '#exportJSON', exportJSON );
	
	$leftSidebar.on( 'change', '#files', setupFileList);
	
	var currentlySelected = "";
	var currentlySelectedFile = "";
	var currentlySelectedAlt = "";
	var currentlySelectedAltFile = "";
	var selectionState = 'primaryFile';
	var $loadLabel = $('#loadFileInformation');

	$leftSidebar.on( 'click', '.fileEntry', function(){ // Toggle selected element and load file/files
		
		if(selectionState == 'secondaryFile' && $(this)[0].children[0].innerHTML.split('.')[1].toLowerCase() != 'seq') {
			selectionState = 'primaryFile';
			if(currentlySelectedAlt != ""){
				currentlySelectedAlt.toggleClass('selectedAlt');
			}
			currentlySelectedAlt = "";
			currentlySelectedAltFile = "";
		}
		
		if(selectionState == 'primaryFile' && $(this)[0].children[0].innerHTML.split('.')[1].toLowerCase() != 'seq'){

			if(currentlySelected != ""){
				currentlySelected.toggleClass('selected');
			}

			currentlySelected = $(this);
			currentlySelectedFile = allFiles[$(this)[0].children[0].innerHTML];
			$loadLabel[0].innerHTML = $(this)[0].children[0].innerHTML;
			$(this).toggleClass('selected');

			if(currentlySelectedFile.name.split('.')[1].toLowerCase() == 'shp'){
				selectionState = 'secondaryFile';
				$loadLabel[0].innerHTML = "Also Select Animation File (SEQ)";
			}

		} else if(selectionState == 'secondaryFile'){
			
			if(currentlySelectedAlt != ""){
				currentlySelectedAlt.toggleClass('selectedAlt');
			}

			currentlySelectedAlt = $(this);
			currentlySelectedAltFile = allFiles[$(this)[0].children[0].innerHTML];
			$loadLabel[0].innerHTML = "( " + currentlySelected[0].children[0].innerHTML + ", " + currentlySelectedAlt[0].children[0].innerHTML + " )";
			$(this).toggleClass('selectedAlt');

		} else {
			$loadLabel[0].innerHTML = 'Cannot load SEQ by itself, select SHP first';
		}
		

		// After selecting load the file
		if(currentlySelectedFile != ""){
			
			if(typeof MPDReference[currentlySelectedFile.name] !== 'undefined'){

				load(allFiles[MPDReference[currentlySelectedFile.name]], currentlySelectedFile);

			} else if( selectionState == 'secondaryFile' ) {
				
				if(currentlySelectedAltFile == ""){

					load( currentlySelectedFile, $fileAltDefault[ 0 ].files[ 0 ] );


				} else {
						
					load( currentlySelectedFile, currentlySelectedAltFile);
					
				}
			} else {

				load( currentlySelectedFile, $fileAltDefault[ 0 ].files[ 0 ] );					
				
			}
		}

	});

	// Grabbing Files
	
	var supportedFiletypes = {'shp': 'Characters', 'wep': 'Weapons', 'zud': 'Combined Files', 'znd': 'Zone Data', 'arm': 'Minimap', 'seq': 'Animations', 'mpd': 'Map'};
	
	var allFiles = {};
	
	function setupFileList() { // Cleanup on isle 10
		
		fileList = $files[0].files; // List of files selected by user
	
		$fileList = $( '#fileList' ); // Element in sidebar that will contain list of files
		
		$fileList[0].innerHTML = "";
		
		//console.log(loaders);
		
		sections = {element: $fileList[0]};

		for(var i = 0; i < fileList.length; i++){ // Iterate through files
			
			// get folders>filename>extension
			relPath = fileList[i].webkitRelativePath.split(new RegExp('["/","."]', 'g'));
			
			ext = relPath[relPath.length-1].toLowerCase();
			
			if(typeof supportedFiletypes[ext] !== 'undefined'){ // If a supported filetype
				
				focus = sections;

				for(var j = 0; j < relPath.length-2; j++){ // Iterate through folder structure
					if(typeof focus['path_name_' + relPath[j]] === 'undefined'){ // If new folder
						var $folder = document.createElement("div");
						$folder.className = 'directory';
						
						var $title = document.createElement("h2");						
						$title.innerHTML = relPath[j];
						$title.className = 'collapsed';

						$folder.appendChild($title);
												
						focus['element'].appendChild($folder);						
						focus['path_name_' + relPath[j]] = {element: $folder};
					}
					focus = focus['path_name_' + relPath[j]];
				}				
				
				$fileEntry = document.createElement("div");
				$fileEntry.className = 'fileEntry';
				$fileText = document.createElement("p");
				$fileText.innerHTML = fileList[i].name;
				$fileText.className = 'fileName';

				$fileDescription = document.createElement("p");	
				$fileDescription.className = 'description';			
				$fileDescription.innerHTML = supportedFiletypes[ext];
				
				$fileEntry.appendChild($fileText);
				$fileEntry.appendChild($fileDescription);

				allFiles[fileList[i].name] = fileList[i];

				focus['element'].appendChild($fileEntry);
			};

		}
		//console.log(sections);

	}

	// loading

	var loaders = {};

	function load( f1, f2 ) {

		//var f1 = $file1[ 0 ].files[ 0 ];
		//var f2 = $file2[ 0 ].files[ 0 ];

		var reader1 = new FileReader();
		reader1.onload = function () {

			var ext = VSTOOLS.ext( f1.name );
			load2( ext, reader1 );

			if ( ( ext === 'znd' || ext === 'shp' || ext === 'fbc' ) && f2 ) {

				reader2.readAsArrayBuffer( f2 );

			}

		};

		var reader2 = new FileReader();
		reader2.onload = function () {

			var ext = VSTOOLS.ext( f2.name );
			load2( ext, reader2 );

		};

		reader1.readAsArrayBuffer( f1 );

	}

	function load2( ext, reader ) {

		var data = new Uint8Array( reader.result );

		var loader = loaders[ ext ];
		if ( !loader ) throw new Error( 'Unknown file extension ' + ext );

		loader( new VSTOOLS.Reader( data ) );

	}

	loaders.wep = function ( reader ) {

		clean();

		var wep = new VSTOOLS.WEP( reader );
		wep.read();
		wep.build();

		root = wep.mesh;
		scene.add( root );

		updateTextures( wep.textureMap.textures );
		updateAnim();

	};

	loaders.shp = function ( reader ) {

		clean();

		var shp = activeSHP = new VSTOOLS.SHP( reader );
		shp.read();
		shp.build();

		root = shp.mesh;
		scene.add( root );

		if ( $skeleton.is( ':checked' ) ) {

			skeletonHelper = new THREE.SkeletonHelper( shp.mesh );
			skeletonHelper.material.linewidth = 3;
			scene.add( skeletonHelper );

		}

		updateTextures( shp.textureMap.textures );
		updateAnim();

	};

	loaders.seq = function ( reader ) {

		if ( activeSHP ) {

			stopAnim();

			var seq = activeSEQ = new VSTOOLS.SEQ( reader, activeSHP );
			seq.read();
			seq.build();

			updateAnim();

		} else {

			throw new Error( 'Cannot load SEQ without SHP' );

		}

	};

	loaders.zud = function ( reader ) {

		clean();

		var zud = new VSTOOLS.ZUD( reader );
		zud.read();
		zud.build();

		activeSHP = zud.shp;
		activeSEQ = zud.bt || zud.com;

		updateAnim();

		root = zud.shp.mesh;
		scene.add( root );

		if ( $skeleton.is( ':checked' ) ) {

			skeletonHelper = new THREE.SkeletonHelper( root );
			skeletonHelper.material.linewidth = 3;
			scene.add( skeletonHelper );

		}

		updateTextures( zud.shp.textureMap.textures );
		updateAnim();

	};

	loaders.znd = function ( reader ) {

		clean();

		var znd = activeZND = new VSTOOLS.ZND( reader );
		znd.read();

		znd.frameBuffer.build();

		updateTextures( znd.textures );

	};

	loaders.mpd = function ( reader ) {

		clean();

		var mpd = new VSTOOLS.MPD( reader, activeZND );
		mpd.read();
		mpd.build();

		root = mpd.mesh;
		scene.add( root );

		if ( activeZND ) updateTextures( activeZND.textures );

	};

	loaders.arm = function ( reader ) {

		clean();

		var arm = new VSTOOLS.ARM( reader );
		arm.read();
		arm.build();

		root = arm.object;
		scene.add( root );

		updateTextures( [] );

	};

	loaders.gim = function ( reader ) {

		var gim = new VSTOOLS.GIM( reader );
		gim.read();
		gim.build();

		updateTextures( gim.textures );

	};

	loaders.p = function ( reader ) {

		var p = new VSTOOLS.P( reader );
		p.read();
		p.build();

		updateTextures( p.textures );

	};

	var activeFBC;

	loaders.fbc = function ( reader ) {

		var fbc = activeFBC = new VSTOOLS.FBC( reader );
		fbc.read();

	};

	loaders.fbt = function ( reader ) {

		var fbt = new VSTOOLS.FBT( reader, activeFBC );
		fbt.read();

		updateTextures( fbt.textures );

	};

	function clean() {

		activeSHP = null;
		activeSEQ = null;

		stopAnim();

		if ( root ) scene.remove( root );
		if ( skeletonHelper ) scene.remove( skeletonHelper );

	}

	// animation

	function nextAnim() {

		$animation.val( parseAnim() + 1 );

		updateAnim();

	}

	function prevAnim() {

		$animation.val( parseAnim() - 1 );

		updateAnim();

	}

	function updateAnim() {

		if ( !activeSEQ ) {

			return;

		}

		stopAnim();

		var id = parseAnim();

		activeSEQ.animations[ id ].animation.play();

		$animation.val( id );
		$animationCount.html( '0&ndash;' + ( activeSEQ.animations.length - 1 ) );

	}

	function parseAnim() {

		if ( !activeSEQ ) return 0;

		var id = parseInt( $animation.val() );

		if ( !id ) id = 0;

		id = Math.min( activeSEQ.animations.length - 1,  Math.max( 0, id ) );

		return id;

	}

	function stopAnim() {

		if ( !activeSEQ ) return;

		for ( var i = 0, l = activeSEQ.animations.length; i < l; ++i ) {

			activeSEQ.animations[ i ].animation.stop();

		}

	}

	// textures

	function updateTextures( textures ) {

		$textures.empty();

		if ( !textures ) return;

		textures.forEach( function ( texture ) {

			$textures.append( '<img src="' + VSTOOLS.png( texture.image.data, texture.image.width, texture.image.height ) + '">' );

		} );

	}

	// export

	function exportOBJ() {

		if ( root instanceof THREE.SkinnedMesh ) {

			var snapshot = VSTOOLS.geometrySnapshot( root );
			var exporter = new THREE.OBJExporter();
			exportString( exporter.parse( snapshot ) );

		}

	}

	function exportJSON() {

		var t = obj.shp || obj;
		var toExport = t.mesh.geometry;
		var anim = t.seq || seq;

		toExport.computeFaceNormals();

		var output = {
			metadata: {
				formatVersion: 3.1,
				type: 'Geometry',
				generatedBy: 'vstools',
				vertices: toExport.vertices.length,
				faces: toExport.faces.length,
				normals: toExport.faces.length,
				colors: 0,
				uvs: [ toExport.faces.length ],
				materials: 0,
				morphTargets: 0,
				bones: toExport.bones.length
			},
			"materials": [ {
				"DbgColor" : 15658734, // => 0xeeeeee
				"DbgIndex" : 0,
				"DbgName" : "dummy",
				"colorDiffuse" : [ 1, 0, 0 ],
			} ],

			scale: 1.0,
			vertices: flatten3( toExport.vertices ),
			morphTargets: [],
			normals: normals(),
			colors: [],
			uvs: [ uvs() ],
			faces: faces( toExport.faces ),
			bones: bones( toExport.bones ),
			influencesPerVertex: 2,
			skinIndices: skin( toExport.skinIndices ),
			skinWeights: skin( toExport.skinWeights ),
			animations: animations( anim.animations )
		};

		output = JSON.stringify( output, null, '\t' );
		output = output.replace( /[\n\t]+([\d\.e\-\[\]]+)/g, '$1' );
		exportString( output );

		function normals() {

			var flat = [];
			toExport.faces.forEach( function ( f ) {

				flat.push( f.vertexNormals[ 0 ].x, f.vertexNormals[ 0 ].y, f.vertexNormals[ 0 ].z );
				flat.push( f.vertexNormals[ 1 ].x, f.vertexNormals[ 1 ].y, f.vertexNormals[ 1 ].z );
				flat.push( f.vertexNormals[ 2 ].x, f.vertexNormals[ 2 ].y, f.vertexNormals[ 2 ].z );

			} );
			return flat;

		}

		function uvs() {

			var flat = [];
			toExport.faceVertexUvs[ 0 ].forEach( function ( f ) {

				flat.push(
					f[ 2 ].x, f[ 2 ].y,
					f[ 1 ].x, f[ 1 ].y,
					f[ 0 ].x, f[ 0 ].y
				);

			} );
			return flat;

		}

		function faces( arr ) {

			var flat = [];
			var i = 0;
			arr.forEach( function ( f ) {

				flat.push(
					2 + 8 + 32,
					f.a, f.b, f.c,
					0,
					f.a, f.b, f.c,
					f.a, f.b, f.c
				);
				++i;

			} );
			return flat;

		}

		function bones( arr ) {

			return arr;

		}

		function flatten2( arr ) {

			var flat = [];
			arr.forEach( function ( v ) { flat.push( v.x, v.y ); } );
			return flat;

		}

		function flatten3( arr ) {

			var flat = [];
			arr.forEach( function ( v ) { flat.push( v.x, v.y, v.z ); } );
			return flat;

		}

		function skin( arr ) {

			var flat = [];
			arr.forEach( function ( v ) { flat.push( v.x, v.y ); } );
			return flat;

		}

		function animations( arr ) {

			return arr.map( function ( a ) {

				delete a.animationData.initialized;
				return quat2arr( a.animationData );

			} );

		}

		function quat2arr( q ) {

			if ( q instanceof THREE.Quaternion ) {

				return [ q.x, q.y, q.z, q.w ];

			} else if ( q.forEach ) {

				for ( var i = 0; i < q.length; ++i ) {

					q[ i ] = quat2arr( q[ i ] );

				}

			} else if ( q !== null && typeof q === 'object' ) {

				for ( var p in q ) {

					if ( q.hasOwnProperty( p ) ) q[ p ] = quat2arr( q[ p ] );

				}

			}

			return q;

		}

	}

	function exportString( output ) {

		var blob = new Blob( [ output ], { type: 'text/plain' } );
		var objectURL = URL.createObjectURL( blob );

		window.open( objectURL, '_blank' );
		window.focus();

	}

};
