// Special thanks to O. Murray for suggesting exploring this and providing the incentive to try this out.
// This code drew on free online resources and tutorials.

// Please improve, build and share it freely also


// findme note: requires the sketchfab api to be loaded.
// findme note: requires a textured material on the model.

// findme credit: canvas code based on w3schools examples
// findme credit: sketchfab code wrangled out of Sktechfab viewer API examples
// https://sketchfab.com/developers/viewer/examples?sample=Update%20Texture&utm_source=forum&utm_medium=referral

// wait for the page to load fully or the canvas won't draw properly
document.addEventListener("DOMContentLoaded", ready, false);
function ready(){


  // error trap and set defualts for variables passed
  var script_id = document.getElementById('texture_mixer')
  if(typeof script_id.getAttribute('data-max') === undefined) {
      var max = 4096;
    }else{
      var max = script_id.getAttribute('data-max')
    }
  if(typeof script_id.getAttribute('data-mid') === undefined) {
      var mid =  1024;
    }else{
      var mid =  script_id.getAttribute('data-mid')
    }
  if(typeof script_id.getAttribute('data-min') === undefined) {
      var min =  256;
    }else{
      var min =  script_id.getAttribute('data-min')
    }



  // Sketchfab Viewer API set up
  // this is the unique ID of the model in the viewr from the sketchfab URL
  if(typeof script_id.getAttribute('data-uid') === undefined) {
      console.log ('no model uid set');
    }else{
      var uid = script_id.getAttribute('data-uid')
    };

  // the version of the skfb api script used
  if(typeof script_id.getAttribute('data-ver') === undefined) {
      console.log ('no version set');
      stop();
    }else{
      var version = script_id.getAttribute('data-ver')
    };



  var iframe = document.getElementById('api-frame');    // id for sketchfab iframe
  var client = new window.Sketchfab(version, iframe);   // uses the sketchfab api script above
  var apiSkfb;

  var mixedTextureId;            // the sketchfab texture that will be updated with canvas data
  var arrMaterials;              // container for an array of materials present on the model being viewed
  var materialsByName = {};      // object for an individual named material used in registrering textures

  var error = function() {
      console.error('Sketchfab API error');
  };





  // flag used for registering the materials with the api only once
  // but not autmatically replacing the default texture till UI
  // element is used
  var isRegistered = false;


  // slider set up
  var slider = document.getElementById("swap-slider");
  var output = document.getElementById("sliderValue");
  output.innerHTML = slider.value; // Display the default slider value

  // mode switch
  var mode = document.getElementById("mode-toggle");

  // canvas set up
  // findme todo: Setup multiple canvases for multi-texture objects
  var c = document.createElement("CANVAS");
  c.setAttribute("width",min);
  c.setAttribute("height",min);
  c.setAttribute("id","textureCanvas");
  c.classList.add("hidden");
  var img = document.getElementById("texture1");
  var img2 = document.getElementById("texture2");
  var ctx = c.getContext("2d");



  // sets the size of the texture canvas. always sqaure
  function setCanvasSize (context, size) {
    context.canvas.width = size;
    context.canvas.height = size;
  }


  // mix the two images in a hidden canvas
  function mixTextures() {
    ctx.globalAlpha = 1;                        // sets the background image opacity to be maximum
    ctx.drawImage(img,0,0,c.width,c.height);
    ctx.globalAlpha = slider.value/100;         // set the opacity of the overlying image to transparency of the slider.
    ctx.drawImage(img2,0,0,c.width,c.height);
  }


  function udpateTexture(api, quality = 0.92) {
      console.log ('updating texture');
      // render the current canvas into a bit stream to be sent to the texture
      var url = c.toDataURL('image/png', quality);

      //update the registered texture with the new image data
      api.updateTexture(url, mixedTextureId);
  }


  function mixChannels(api){
    // a very helpful example  https://jsfiddle.net/sketchfab/rabweuzd/

    // m.channels.EmitColor.factor = 1;
    for (var i = 0; i < arrMaterials.length; i++) {
      var m = arrMaterials[i]

      m.channels['EmitColor'].factor = 1 - slider.value/100;

/*
      use uid to set the texture if the emit isn't on when lodaded
      if Emit is 0, or off then the texture won't load.
      need to hack it, either 0.01 emit works, or apply texture on a hidden object

      m.channels['EmitColor'].enable = true;
      m.channels['EmitColor'].texture = {
          uid: 'e4265377f6e441cbb525bc89a470f643'
      };
*/

      m.channels.AlbedoPBR.factor = slider.value/100;
      api.setMaterial(m);
    }
  }


  // textures the model with a new image replacing the default image
  function registerTexture(api) {
      // set the data url to the current canvas output
      var url = c.toDataURL('image/png', 0.92);

      // register the texture with the api
      api.addTexture(url, function(err, textureId) {
          mixedTextureId = textureId;

          //findme todo: implement multiple material support
          if (arrMaterials.length > 1) {
            console.log("multiple material handling not yet implemented");
          }
          var m = arrMaterials[0];

          // apply the texture
          m.channels['AlbedoPBR'].texture = {
              uid: textureId
          };

          // disable emit texture
//        m.channels['EmitColor'].enable = false;
          // disable the normal map
//        m.channels['NormalMap'].enable = false;

          // set the material
          api.setMaterial(m);

      });
  }




  // kick off the code once the sketchfab api link is running
  var success = function(api) {
      apiSkfb = api;
      api.start(function() {
          // wait for the viewer to be active
          api.addEventListener('viewerready', function() {
             api.getTextureList( function( err, textures ) {
                      console.log('textures');
            			    console.log( textures );
            			    console.log( textures[textures.length-1].uid );
            			} );


              // remove the loading message
              document.getElementById("loading").classList.add("hidden");

              // show the controls
          		console.log('viewer ready');
              document.getElementById("swapper-controls").classList.add("fade-in");
              document.getElementById("swapper-controls").classList.remove("invisible");

              // Only done once
              // get materials on current model and output in console if need to get a name of one later
              api.getMaterialList(function(err, materials) {
                  arrMaterials = materials;
                  // findme todo: impliment multi-texture handling
                  // check if there is more than 1 material and spew out the names

                  // output materials to console and create named array of objects that can
                  // be used as reference later. From starting example not really needed (?)
                  for (var i = 0; i < arrMaterials.length; i++) {
                      var m = arrMaterials[i];
                      materialsByName[m.name] = m;
                      console.log('pick a material ', m.name);
                  }
              });


              // Slider handling
              // Update the current slider value (each time you drag the slider handle)
              slider.oninput = function() {
                // basic mode function
                if (mode.checked){
                  // use the emit channel mixer
                  mixChannels(api);
                }else{
                  // use a local canvas
                  setCanvasSize(ctx,min);
                  mixTextures();                  // mix the images in the canvas
                  // check if the texture is registered already so the swap is only made when the slider is used
                  if (!isRegistered){
                    registerTexture(api);         // register textures and apply canvas content
                    isRegsitered = true;
                  }else{
                    udpateTexture(apiSkfb, 0.1);    // update the model texture
                  }
                }
                output.innerHTML = this.value;  // update text display
              }

              // Button handling
              // findme todo: change into a toggle (?)
              btnDetail.onmousedown = function () {
                setCanvasSize(ctx,max);
                mixTextures();
                // check if the texture is registered already so the swap is only made when the button is used
                if (!isRegistered){
                  registerTexture(api);          // register textures and apply canvas content
                  isRegsitered = true;
                }else{
                  udpateTexture(apiSkfb, 0.92);   // update the model texture
                }
              }

              btnDetail.onmouseup = function () {
                setCanvasSize(ctx,mid);
                mixTextures();
                udpateTexture(apiSkfb, 0.1);    // update the model texture
              }

                // set the canvas to a larger size and update texture for hi-res texture after sliding finished
//              function sliderMouseUp () {
                slider.onmouseup = function () {
                  // resize the canvas to be small and fast
                  console.log('up');
                  setCanvasSize(ctx,mid)

                  // mix images at a larger size
                  mixTextures();

                  // update the texture
                  udpateTexture(apiSkfb);
                }
          });


          // nab the gui div in the sketchfab viewer
          var newParent = document.getElementById('api-frame').contentWindow.document.getElementsByClassName('gui')[0];
          var oldParent = document.getElementById('slider-container');

          // loop through and take anything inside the container and shove it into the sketchfab controls
          while (oldParent.childNodes.length > 0) {
              newParent.appendChild(oldParent.childNodes[0]);
          }
      });



  };


  // initialise the sketchfab api
  client.init(uid, {
      success: success,
      error: error,
      autostart: 1,
      camera: 0,
      preload: 1
  });

}



// findme@hairystickman.co.uk
