import * as THREE from '../libs/three.js-r132/build/three.module.js';
import {ARButton} from '../libs/three.js-r132/examples/jsm/webxr/ARButton.js';
import { loadGLTF } from '../libs/loader.js';

function handleSelection(selectModel, currentModel,currentModelId, scene){
  if(currentModel!==null)
  {
    scene.remove(currentModel.scene);
  }
  scene.add(selectModel.scene);
  currentModel = selectModel;
  document.querySelectorAll('.button').forEach(button => {
    if(button.id !== currentModelId.id && button.classList.contains("active")){
      button.classList.toggle('active');
    }
})  
}

document.addEventListener('DOMContentLoaded', () => {
  const initialize = async() => {
    /////init scene cam rend
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera();
    const renderer = new THREE.WebGLRenderer({alpha: true});
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    const light = new THREE.HemisphereLight(0xffffff, 0xbbbbff, 1)
    scene.add(light);
    /////marker
    const recticleGeometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI/2);
    const recticleMat = new THREE.MeshBasicMaterial();
    const recticle = new THREE.Mesh(recticleGeometry,recticleMat);
    recticle.matrixAutoUpdate = false;
    recticle.visible = false
    scene.add(recticle);    
    /////load models
    const chairModel = await loadGLTF("./assets/chair/scene.gltf")
    const tableModel = await loadGLTF("./assets/coffee-table/scene.gltf")
    const cushionModel = await loadGLTF("./assets/cushion/scene.gltf")
    chairModel.scene.scale.set(0.6,0.6,0.6);
    tableModel.scene.scale.set(0.06,0.06,0.06);
    
    /////html interaction
    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('click', () => {
          button.classList.toggle('active');
      });
    });
    const chairId = document.querySelector("#chair");
    const tableId = document.querySelector("#table");
    const cushionId = document.querySelector("#cushion");    
    let currentModel = null;
    chairId.addEventListener("click", () => {
      handleSelection(chairModel,currentModel ,chairId, scene);
      currentModel = chairModel;
    })
    tableId.addEventListener("click", () => {
      handleSelection(tableModel,currentModel ,tableId, scene);
      currentModel = tableModel;
    })
    cushionId.addEventListener("click", () => {
      handleSelection(cushionModel,currentModel ,cushionId, scene);
      currentModel = cushionModel;
    })
    /////controller
    const controller = renderer.xr.getController(0);
    scene.add(controller);    
    controller.addEventListener("select", ()=>{
      if(currentModel === null) return;
      scene.add(currentModel.scene.clone());
    });
    /////renderer, update every frame
    renderer.xr.addEventListener("sessionstart", async(e) => {
      const session = renderer.xr.getSession();
      const viewerReferenceSpace = await session.requestReferenceSpace("viewer");
      const hitTestSource = await session.requestHitTestSource({space: viewerReferenceSpace});
      renderer.setAnimationLoop((timestamp, frame) => {
        if(!frame) return;
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        if(hitTestResults.length) {
          const hit = hitTestResults[0];
          const referenceSpace = renderer.xr.getReferenceSpace();
          const hitPose = hit.getPose(referenceSpace);
          recticle.visible = true;
          recticle.matrix.fromArray(hitPose.transform.matrix);
          if(currentModel !== null){
            currentModel.scene.position.setFromMatrixPosition(recticle.matrix);
          }
        } else {
          recticle.visible= false;
        }
        renderer.render(scene, camera);
      })
    })    

    const arButton = ARButton.createButton(renderer, {requiredFeatures: ['hit-test'], optionalFeatures: ['dom-overlay'], domOverlay: {root: document.body}});
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(arButton);
    
  }
  initialize();
});
