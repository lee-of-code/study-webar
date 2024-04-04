const THREE = window.MINDAR.FACE.THREE;
import {loadGLTF} from "../libs/loader.js";
//////////capture
const capture = (mindarThree) => {
  const {video, renderer, scene, camera} = mindarThree;
  const renderCanvas = renderer.domElement;

  const canvas = document.createElement("canvas");
  canvas.width = renderCanvas.width;
  canvas.height = renderCanvas.height;
  
  const context = canvas.getContext("2d");
  const sx = (video.clientWidth - renderCanvas.clientWidth) / 2 * (video.videoWidth / video.clientWidth);
  const sy = (video.clientHeight - renderCanvas.clientHeight) / 2 * (video.videoHeight/ video.clientHeight);
  const sw = video.videoWidth - sx * 2;
  const sh = video.videoHeight - sy * 2;
  context.drawImage(video, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);

  renderer.preserveDrawingBuffer = true;
  renderer.render(scene, camera);
  context.drawImage(renderCanvas, 0, 0, canvas.width, canvas.height);
  renderer.preserveDrawingBuffer = false;

  const data = canvas.toDataURL("image/png");
  return data;
}
//////////toggle
function toggleModel(id, anchor, model) {
  if(id.classList.contains("active"))
  {
    anchor.group.add(model.scene);
  }
  else {
    anchor.group.remove(model.scene);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const start = async() => {

    const mindarThree = new window.MINDAR.FACE.MindARThree({
      container: document.body,
    });
    const {renderer, scene, camera} = mindarThree;
    const light = new THREE.HemisphereLight( 0xffffff, 0xbbbbff, 1 );
    scene.add(light);
    //////////occluder
    const faceOccluder = await loadGLTF("./assets/sparkar-occluder/headOccluder.glb");
    faceOccluder.scene.scale.set(0.065,0.065,0.065);
    faceOccluder.scene.position.set(0, -0.3, 0.15);
    const occluderMat = new THREE.MeshBasicMaterial({colorWrite: false});
    faceOccluder.scene.traverse( (o) => {
      if(o.isMesh){
        o.material = occluderMat;
      }
    });
    faceOccluder.scene.renderOrder = 0;
    //////////models loading
    const occluderAnchor = mindarThree.addAnchor(168);
    occluderAnchor.group.add(faceOccluder.scene);

    const hat1Model = await loadGLTF("./assets/hat1/scene.gltf");
    const hat2Model = await loadGLTF("./assets/hat2/scene.gltf");
    const glasses1Model = await loadGLTF("./assets/glasses1/scene.gltf");
    const glasses2Model = await loadGLTF("./assets/glasses2/scene.gltf");
    const earringRModel = await loadGLTF("./assets/earring/scene.gltf");
    const earringLModel = await loadGLTF("./assets/earring/scene.gltf");

    hat1Model.scene.scale.set(0.35,0.35,0.35);
    hat1Model.scene.position.set(0,1,0);
    hat2Model.scene.scale.set(0.008,0.008,0.008);
    glasses1Model.scene.scale.set(0.008,0.008,0.008);    
    glasses2Model.scene.scale.set(0.5,0.5,0.5);
    glasses2Model.scene.rotation.y = -Math.PI/2;
    glasses2Model.scene.position.set(0,-0.2,0);
    earringRModel.scene.scale.set(0.2,0.2,0.2);
    earringRModel.scene.position.set(0,-0.6,0);
    earringLModel.scene.scale.set(0.2,0.2,0.2);
    earringLModel.scene.position.set(0,-0.6,0);

    hat1Model.scene.renderOrder = 1;
    hat2Model.scene.renderOrder = 1;
    glasses1Model.scene.renderOrder = 1;
    glasses2Model.scene.renderOrder = 1;
    earringRModel.scene.renderOrder = 1;
    earringLModel.scene.renderOrder = 1;

    const hat1Anchor = mindarThree.addAnchor(10);
    
    const hat2Anchor = mindarThree.addAnchor(10);
    const glasses1Anchor = mindarThree.addAnchor(168);
    const glasses2Anchor = mindarThree.addAnchor(168);
    const earringRAnchor = mindarThree.addAnchor(454);
    const earringLAnchor = mindarThree.addAnchor(234);

    //////////control interaction
    
    const hat1Id = document.querySelector("#hat1");
    const hat2Id = document.querySelector("#hat2");
    const glasses1Id = document.querySelector("#glasses1");
    const glasses2Id = document.querySelector("#glasses2");
    const earringId = document.querySelector("#earring");    

    document.querySelectorAll('.button').forEach(button => {
      button.addEventListener('click', () => {
          button.classList.toggle('active');
      });
    });

    hat1Id.addEventListener("click", () => {
      toggleModel(hat1Id, hat1Anchor, hat1Model);
    })    
    hat2Id.addEventListener("click", () => {
      toggleModel(hat2Id, hat2Anchor, hat2Model);
    }) 
    glasses1Id.addEventListener("click", () => {
      toggleModel(glasses1Id, glasses1Anchor, glasses1Model);
    }) 
    glasses2Id.addEventListener("click", () => {
      toggleModel(glasses2Id, glasses2Anchor, glasses2Model);
    }) 
    earringId.addEventListener("click", () => {
      toggleModel(earringId, earringRAnchor, earringRModel);
      toggleModel(earringId, earringLAnchor, earringLModel);
    }) 

    
    document.querySelector("#capture").addEventListener("click", () => {
      const data = capture(mindarThree);
      preview.style.visibility = "visible";
      previewImage.src = data;
    });
    const previewImage = document.querySelector("#preview-image");
    const previewClose = document.querySelector("#preview-close");
    const preview = document.querySelector("#preview");
    const previewShare = document.querySelector("#preview-share");

    previewClose.addEventListener("click", () => {
      preview.style.visibility = "hidden";
    });

    previewShare.addEventListener("click", () => {
      const canvas = document.createElement("canvas");
      canvas.width = previewImage.width;
      canvas.height = previewImage.height;
      const context = canvas.getContext("2d");
      context.drawImage(previewImage, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        const file = new File([blob], "photo.png", {type: "image/png"});
        const files = [file];
        if(navigator.canShare && navigator.canShare({files})) {
          navigator.share({
            files: files,
            title: "AR Photo"
          })
        } else {
          const link = document.createElement("a");
          link.download = "photo.png";
          link.href = previewImage.src;
          link.click();
        }
      })
    });

    await mindarThree.start();
    renderer.setAnimationLoop(() => {
      renderer.render(scene, camera);
    });
  }
  start();
});

