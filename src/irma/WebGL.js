/**
 * WebGL implementation of world rendering. Should have the same API like
 * Canvas class, but should work faster, because of WebGL shaders.
 * 
 * @author Taras Kohut
 */
class WebGl {
    renderer;
     scene;
      camera;
       stats;
      particleSystem;
      uniforms;
       geometry;
      PARTICLES_COUNT = 30000000;
       maxWeight = 4700;

    
      width = window.innerWidth;
      height = window.innerHeight;

      fov = 40;
      near = 1;
      far = 4500;
      size = height / 109;
      camera = new THREE.PerspectiveCamera(fov, width / height, near, far);
      // remember these initial values
      tanFOV = Math.tan(((Math.PI / 180) * camera.fov) / 2);
      initialHeight = window.innerHeight
      
    constructor() {
      init();
      let zoom = d3
        .zoom()
        .scaleExtent([getScaleFromZ(far), getScaleFromZ(near)])
        .on("zoom", () => {
          let d3_transform = d3.event.transform;
          zoomHandler(d3_transform);
        });

      view = d3.select(renderer.domElement);
        setUpZoom();
        createWorld();

      animate();

    }

    init() {
      scene = new THREE.Scene();
      scene.background = new THREE.Color(0x000000);
      
      renderer = new THREE.WebGLRenderer();
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.setSize(window.innerWidth, window.innerHeight);

      var container = document.getElementById("container");
      container.appendChild(renderer.domElement);

      stats = new Stats();
      container.appendChild(stats.domElement);
      window.addEventListener("resize", onWindowResize, false);
    }

    createWorld() {
      var textureLoader = new THREE.TextureLoader();
      uniforms = {
        time: { type: "f", value: 0 },
        pointTextures: {
          value: [
            textureLoader.load("images/microbe64new.png"),
            textureLoader.load("images/food64new.png")
          ]
        }
      };

      var shaderMaterial = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: document.getElementById("vertexshader").textContent,
        fragmentShader: document.getElementById("fragmentshader").textContent,
        depthTest: false,
        depthWrite: false,
        transparent: true,
        vertexColors: true
      });
      geometry = new THREE.BufferGeometry();

      var positions = [];
      var colors = [];
      var sizes = [];
      var textureIndexes = [];
      //---
      var vFOV = THREE.Math.degToRad(camera.fov); // convert vertical fov to radians
      var vheight = 2 * Math.tan(vFOV / 2) * camera.position.z; // visible height
      var vwidth = vheight * camera.aspect;

      size = window.devicePixelRatio  * (height / 218);
      //---
      var color = new THREE.Color();
      var j = 0,
        ln = 0;
      for (i = 0; i < PARTICLES_COUNT; i++) {
        positions.push(j);
        positions.push(ln);
        positions.push(0);
        textureIndexes.push(2);
        //color.setHSL( i / PARTICLES_COUNT, 1.0, 0.5 );
        colors.push(color.r, color.g, color.b);
        sizes.push(size);

        if ((j + 1) % maxWeight == 0) {
          ln++;
          j = 0;
        } else {
          j++;
        }
      }

      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "color",
        new THREE.Float32BufferAttribute(colors, 3)
      );
      geometry.setAttribute(
        "size",
        new THREE.Float32BufferAttribute(sizes, 1).setUsage(
          THREE.DynamicDrawUsage
        )
      );
      geometry.setAttribute(
        "texIndex",
        new THREE.Float32BufferAttribute(textureIndexes, 1)
      );

      particleSystem = new THREE.Points(geometry, shaderMaterial);
      scene.add(particleSystem);
    }

    // TODO: implement animation frame and this._visualize logic (see Canvas.js)
    // TODO: use _prepareDom() for creating canvas element
    destory() {
       // TODO: should remove canvas element, unbinds event listeners
    }

    visualize() {
       // TODO: should start/stop visualization using this._visualize
    }

    addMicrobe(x, y) {
      let position = maxWeight * y + x;
      const texIndex = geometry.attributes.texIndex;
      texIndex.array[position] = 0;
      texIndex.needsUpdate = true;
    }

    addFood(x, y) {
      if (checkMicrobe(x, y)) {
        return;
      }
      let position = maxWeight * y + x;
      // TODO: optimize properties
      geometry.attributes.texIndex.array[position] = 1;
      geometry.attributes.texIndex.needsUpdate = true;
    }

    remove(x, y) {
      let position = maxWeight * y + x;
      geometry.attributes.texIndex.array[position] = 2;
      geometry.attributes.texIndex.needsUpdate = true;
    }

    move(x, y, newX, newY) {
      if (x == newX && y == newY) {
        return;
      }
      const position = maxWeight * y + x;
      const newPosition = maxWeight * newY + newX;
      geometry.attributes.texIndex.array[newPosition] =
      geometry.attributes.texIndex.array[position];
      geometry.attributes.texIndex.array[position] = 2;
      geometry.attributes.texIndex.needsUpdate = true;
    }

    animate() {
      uniforms.time.value += 0.05;
      requestAnimationFrame(animate);
      demoGameLoop();
      render();
      stats.update();
    }

    render() {
      //var time = Date.now() * 0.005;
     // var sizes = geometry.attributes.size.array;
      renderer.render(scene, camera);
    }

    setUpZoom() {
      view.call(zoom);
      let initial_scale = getScaleFromZ(far);
      var initial_transform = d3.zoomIdentity
        .translate(width / 2, height / 2)
        .scale(initial_scale);
      zoom.transform(view, initial_transform);
      camera.position.set(0, 0, far);
    }
    

    zoomHandler(d3_transform) {
      let scale = d3_transform.k;
      let x = -(d3_transform.x - width / 2) / scale;
      let y = (d3_transform.y - height / 2) / scale;
      let z = getZFromScale(scale);
      camera.position.set(x, y, z);
    }

    getScaleFromZ(camera_z_position) {
      let half_fov = fov / 2;
      let half_fov_radians = toRadians(half_fov);
      let half_fov_height = Math.tan(half_fov_radians) * camera_z_position;
      let fov_height = half_fov_height * 2;
      let scale = height / fov_height; // Divide visualization height by height derived from field of view
      return scale;
    }

    getZFromScale(scale) {
      let half_fov = fov / 2;
      let half_fov_radians = toRadians(half_fov);
      let scale_height = height / scale;
      let camera_z_position = scale_height / (2 * Math.tan(half_fov_radians));
      return camera_z_position;
    }

    toRadians(angle) {
      return angle * (Math.PI / 180);
    }

    onWindowResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.fov = ( 360 / Math.PI ) * Math.atan( tanFOV * ( window.innerHeight / initialHeight ) );
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }


    header(text) {
    }
}

module.exports = WebGl;