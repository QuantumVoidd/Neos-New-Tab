// solar-system-assets.js
class SolarSystemAssets {
    constructor() {
        // Main engine handles initialization
    }

    loadExtraModels(gltfLoader, fixModelUVs, S) {
        // --- SHIPS & ROCKETS LOADING ---

        gltfLoader.load(this.getTexUrl('three-models/star_wars_galaxies_-_tie_advanced.glb'), (gltf) => {
            const tie = gltf.scene;
            fixModelUVs(tie); 
            tie.scale.set(0.015, 0.015, 0.015);
            const box = new THREE.Box3().setFromObject(tie);
            const center = box.getCenter(new THREE.Vector3());
            tie.position.sub(center); 
            this.tieModel = new THREE.Group();
            this.tieModel.add(tie);
            this.shipGroup.add(this.tieModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/millennium falcon.glb'), (gltf) => {
            const falcon = gltf.scene;
            fixModelUVs(falcon); 
            falcon.scale.set(0.4, 0.4, 0.4); 
            const box = new THREE.Box3().setFromObject(falcon);
            const center = box.getCenter(new THREE.Vector3());
            falcon.position.sub(center);
            falcon.rotation.y = 0; 

            this.falconModel = new THREE.Group();
            this.falconModel.add(falcon);
            this.shipGroup.add(this.falconModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/planet_express_spaceship.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.2, 0.2, 0.2); 
            
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.set(-center.x, -center.y, -center.z);
            
            const wrapper = new THREE.Group();
            wrapper.add(ship);
            wrapper.rotation.y = -Math.PI / 2; 
            
            this.planetExpressModel = new THREE.Group();
            this.planetExpressModel.add(wrapper);
            this.shipGroup.add(this.planetExpressModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/rick_and_morty_space_ship.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(1.2, 1.2, 1.5);
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            ship.rotation.y = 0; 
            
            this.rickMortyModel = new THREE.Group();
            this.rickMortyModel.add(ship);
            this.shipGroup.add(this.rickMortyModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/guardians_of_the_galaxy_avengers_benatar_ship.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.01, 0.01, 0.01);
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            ship.rotation.y = 0; 
            
            this.benatarModel = new THREE.Group();
            this.benatarModel.add(ship);
            this.shipGroup.add(this.benatarModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/x-wing.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.2, 0.2, 0.2); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            ship.rotation.y = 0; 
            
            this.xwingModel = new THREE.Group();
            this.xwingModel.add(ship);
            this.shipGroup.add(this.xwingModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/x-wing_cockpit_version_2.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(1.0, 1.0, 1.0);
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.xwingCockpitModel = new THREE.Group();
            this.xwingCockpitModel.add(ship);
            this.shipGroup.add(this.xwingCockpitModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/tardis.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.5, 0.5, 0.5); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.tardisModel = new THREE.Group();
            this.tardisModel.add(ship);
            this.shipGroup.add(this.tardisModel);
            this.updateShipVisibility();
        });

        gltfLoader.load(this.getTexUrl('three-models/u.s.s._enterprise_ncc-1701-a.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship); 
            ship.scale.set(0.03, 0.03, 0.03); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.enterpriseModel = new THREE.Group();
            this.enterpriseModel.add(ship);
            this.shipGroup.add(this.enterpriseModel);
            this.updateShipVisibility();
        });

        // Global Hawk
        gltfLoader.load(this.getTexUrl('three-models/Global Hawk.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(0.020, 0.020, 0.020); 
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.sub(center);
            
            this.globalHawkModel = new THREE.Group();
            this.globalHawkModel.add(ship);
            this.shipGroup.add(this.globalHawkModel);
            this.updateShipVisibility();
        });

        // Saturn V
        gltfLoader.load(this.getTexUrl('three-models/rockets/Saturn V.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(0.7, 0.7, 0.7); 
            
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            
            // Move mesh so its visual center is at 0,0,0 local
            ship.position.x = -center.x;
            ship.position.y = -center.y;
            ship.position.z = -center.z;
            
            const pivot = new THREE.Group();
            pivot.add(ship);
            
            pivot.rotation.set(Math.PI / 2, 0, 0);
            
            this.saturnVModel = new THREE.Group();
            this.saturnVModel.add(pivot);
            this.shipGroup.add(this.saturnVModel);
            this.updateShipVisibility();
        });

        // Explorer Jupiter-C
        gltfLoader.load(this.getTexUrl('three-models/rockets/Explorer Jupiter-C Rocket.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(2.3, 2.3, 2.3); 
           
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            
            ship.position.x = -center.x;
            ship.position.y = -center.y;
            ship.position.z = -center.z;
            
            const pivot = new THREE.Group();
            pivot.add(ship);
            
            // Rotate X -90 (lay flat) then Y 0 (Faces Forward hopefully)
            pivot.rotation.set(Math.PI / 2, 0, 0);

            this.jupiterCModel = new THREE.Group();
            this.jupiterCModel.add(pivot);
            this.shipGroup.add(this.jupiterCModel);
            this.updateShipVisibility();
        });

        // 1. Atlas V 402
        gltfLoader.load(this.getTexUrl('three-models/rockets/atlas_v_401.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(35.0, 35.0, 35.0); 
            
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.set(-center.x, -center.y, -center.z);
            
            const pivot = new THREE.Group();
            pivot.add(ship);
            pivot.rotation.set(Math.PI / 2, 0, 0);

            this.atlasVModel = new THREE.Group();
            this.atlasVModel.add(pivot);
            this.shipGroup.add(this.atlasVModel);
            this.updateShipVisibility();
        });

        // 2. NASA Nexus
        gltfLoader.load(this.getTexUrl('three-models/rockets/nexus_nasa_1960s_super_heavy_rocket_project.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(0.2, 0.2, 0.2);
            
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.set(-center.x, -center.y, -center.z);
            
            const pivot = new THREE.Group();
            pivot.add(ship);
            pivot.rotation.set(Math.PI / 2, 0, 0);

            this.nexusModel = new THREE.Group();
            this.nexusModel.add(pivot);
            this.shipGroup.add(this.nexusModel);
            this.updateShipVisibility();
        });

        // 3. Classic Rocket 
        gltfLoader.load(this.getTexUrl('three-models/rockets/rocket_ship.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(7.2, 7.2, 7.2);
            
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.set(-center.x, -center.y, -center.z);
            
            const pivot = new THREE.Group();
            pivot.add(ship);
            pivot.rotation.set(Math.PI / 2, 0, 0); 

            this.classicRocketModel = new THREE.Group();
            this.classicRocketModel.add(pivot);
            this.shipGroup.add(this.classicRocketModel);
            this.updateShipVisibility();
        });

            // 4. NASA Space Shuttle
            gltfLoader.load(this.getTexUrl('three-models/orbiter_space_shuttle_ov-103_discovery.glb'), (gltf) => {
            const ship = gltf.scene;
            fixModelUVs(ship);
            ship.scale.set(2.4, 2.4, 2.4);
    
            const box = new THREE.Box3().setFromObject(ship);
            const center = box.getCenter(new THREE.Vector3());
            ship.position.set(-center.x, -center.y, -center.z);

            ship.rotation.y = Math.PI;

            this.shuttleModel = new THREE.Group();
            this.shuttleModel.add(ship); // Add the fixed ship directly
            this.shipGroup.add(this.shuttleModel);
            this.updateShipVisibility();
        });

        // --- END NEW ADDITIONS ---

        // --- SEV (Space Exploration Vehicle) ---
        // Loaded into memory but not added to scene until deployed
        gltfLoader.load(this.getTexUrl('three-models/Space Exploration Vehicle.glb'), (gltf) => {
            const model = gltf.scene;
            fixModelUVs(model);
            model.scale.set(0.002 * S, 0.002 * S, 0.002 * S);
            
            // Adjust center/rotation logic if necessary to sit flat
            model.rotation.set(0, 0, 0);
            
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            model.position.set(-center.x, -center.y + (size.y / 2), -center.z);
            
            this.sevGroup = new THREE.Group();
            this.sevGroup.add(model);
            this.sevGroup.visible = false;
            
            const sevLight = new THREE.PointLight(0xaaddff, 0.05, 5 * S);
            sevLight.position.set(0, 0.02 * S, 0);
            this.sevGroup.add(sevLight);

            // Store for dynamic use
            this.sevModel = this.sevGroup; 
        });

        gltfLoader.load(this.getTexUrl('three-models/Gateway Core.glb'), (gltf) => {
            const model = gltf.scene;
            fixModelUVs(model); 
            model.scale.set(0.02 * S, 0.02 * S, 0.02 * S);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.material.envMap = this.gatewayEnvMap; // Ensure gatewayEnvMap is accessible or passed in
                    child.material.envMapIntensity = 1.5;
                }
            });
            this.planets['gateway'].mesh.add(model); // Adjust pathing based on your main script changes
        });

        gltfLoader.load(this.getTexUrl('three-models/ISS_stationary.glb'), (gltf) => {
            const model = gltf.scene;
            fixModelUVs(model); 
            model.scale.set(0.0025 * S, 0.0025 * S, 0.0025 * S); 
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.x = -center.x;
            model.position.y = -center.y;
            model.position.z = -center.z;
            const centerContainer = new THREE.Group();
            centerContainer.add(model);
            this.planets['iss'].mesh.add(centerContainer); // Adjust pathing based on your main script changes
        });

        gltfLoader.load(this.getTexUrl('three-models/Apollo Lunar Module.glb'), (gltf) => {
            const model = gltf.scene;
            fixModelUVs(model); 
            model.scale.set(0.008 * S, 0.008 * S, 0.008 * S);
            model.rotation.set(0, 0, Math.PI / 2);
            this.planets['apollo'].mesh.add(model); // Adjust pathing based on your main script changes
        });

        gltfLoader.load(this.getTexUrl('three-models/Mars 2020 Perseverance Rover.glb'), (gltf) => {
            const model = gltf.scene;
            fixModelUVs(model); 
            model.scale.set(0.002 * S, 0.002 * S, 0.002 * S);
            
            // Fix: Remove the manual 90-degree X-axis rotation that flipped the rover onto its nose. 
            // Ensures the orientation remains default.
            model.rotation.set(0, 0, 0); 
            
            // Fix: Modify centering logic to keep wheels flush with the ground instead of clipped exactly halfway.
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            const size = box.getSize(new THREE.Vector3());
            
            // Re-align so that bottom of the bounding box rests at Y = 0
            model.position.set(-center.x, -center.y + (size.y / 2), -center.z);
            
            this.roverModel = new THREE.Group();
            this.roverModel.add(model);
            this.roverGroup.add(this.roverModel);
        });

        gltfLoader.load(this.getTexUrl('three-models/black_hole.glb'), (gltf) => {
            const model = gltf.scene;
            fixModelUVs(model); 
            model.scale.set(0.5 * S, 0.5 * S, 0.5 * S); 
            const box = new THREE.Box3().setFromObject(model);
            const center = box.getCenter(new THREE.Vector3());
            model.position.sub(center);
            this.planets['blackhole'].mesh.add(model); // Adjust pathing based on your main script changes
        });
    }

    createEngineMenu() {
        // --- LEFT SIDEBAR (3D Trapezoid with Rounded Corners & Black Backdrop) ---
        this.engineSidebarWrapper = document.createElement('div');
        this.engineSidebarWrapper.style.cssText = `
            position: absolute; left: 30px; top: 12%; width: 400px; height: 76%;
            perspective: 600px; 
            z-index: 10010; transition: opacity 0.3s ease; pointer-events: none;
        `;

        this.engineSidebar = document.createElement('div');
        this.engineSidebar.style.cssText = `
            width: 100%; height: 100%;
            background: rgba(0, 0, 0, 0.8); 
            backdrop-filter: blur(10px);
            border: 2px solid rgba(var(--ui-rgb), 0.4);
            border-radius: 25px; 
            box-shadow: 0 10px 40px rgba(0,0,0,0.9); 
            transform: rotateY(25deg); 
            transform-origin: left center;
            display: flex; flex-direction: row; overflow: hidden;
            box-sizing: border-box; color: var(--ui-color); pointer-events: auto;
        `;

        const navCol = document.createElement('div');
        navCol.style.cssText = `width: 125px; border-right: 1px solid rgba(var(--ui-rgb), 0.3); display: flex; flex-direction: column; padding: 25px 10px; background: rgba(0, 0, 0, 0.5);`;
        
        const createTabBtn = (id, text, active) => {
            const btn = document.createElement('div');
            btn.textContent = text;
            btn.style.cssText = `
                padding: 12px 5px; cursor: pointer; text-transform: uppercase; font-size: 0.75rem;
                font-weight: bold; transition: 0.2s; background: ${active ? 'rgba(var(--ui-rgb), 0.2)' : 'rgba(0, 0, 0, 0.5)'};
                border-radius: 50px; margin-bottom: 8px; text-align: center; letter-spacing: 1px;
                box-shadow: ${active ? '0 0 10px rgba(var(--ui-rgb), 0.2)' : 'none'};
                color: ${active ? '#ffffff' : 'var(--ui-color)'};
                border: 1px solid ${active ? 'rgba(var(--ui-rgb), 0.5)' : 'transparent'};
            `;
            btn.onclick = () => {
                document.querySelectorAll('.engine-tab-btn').forEach(b => {
                    b.style.background = 'rgba(0, 0, 0, 0.5)'; b.style.boxShadow = 'none'; b.style.color = 'var(--ui-color)'; b.style.border = '1px solid transparent';
                });
                btn.style.background = 'rgba(var(--ui-rgb), 0.2)'; btn.style.boxShadow = '0 0 10px rgba(var(--ui-rgb), 0.2)'; btn.style.color = '#ffffff'; btn.style.border = '1px solid rgba(var(--ui-rgb), 0.5)';
                document.querySelectorAll('.engine-tab-panel').forEach(p => p.style.display = 'none');
                document.getElementById(id).style.display = 'flex';
            };
            btn.className = 'engine-tab-btn';
            return btn;
        };

        const planetsBtn = createTabBtn('engine-tab-planets', 'Planets', true);
        const envBtn = createTabBtn('engine-tab-env', 'Space', false);
        const shipsBtn = createTabBtn('engine-tab-ships', 'Ships', false);
        const rocketsBtn = createTabBtn('engine-tab-rockets', 'Rockets', false); 
        const controlsBtn = createTabBtn('engine-tab-controls', 'Controls', false);
        const systemBtn = createTabBtn('engine-tab-system', 'Settings', false);
        
        navCol.appendChild(planetsBtn);
        navCol.appendChild(envBtn);
        navCol.appendChild(shipsBtn);
        navCol.appendChild(rocketsBtn); // NEW
        navCol.appendChild(controlsBtn);
        navCol.appendChild(systemBtn);

        const navSpacer = document.createElement('div');
        navSpacer.style.cssText = "margin-top: auto; border-top: 1px solid rgba(var(--ui-rgb), 0.3); padding-top: 15px; width: 100%; display: flex; flex-direction: column; gap: 8px;";
        
        const fsBtn = document.createElement('button');
        fsBtn.textContent = 'FULLSCREEN';
        fsBtn.style.cssText = `
            background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(var(--ui-rgb), 0.5); color: var(--ui-color); padding: 8px 5px;
            cursor: pointer; font-family: inherit; font-weight: bold; border-radius: 50px;
            font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; text-align: center;
        `;
        fsBtn.addEventListener('mouseover', () => { fsBtn.style.background = 'rgba(var(--ui-rgb), 0.2)'; fsBtn.style.boxShadow = '0 0 8px rgba(var(--ui-rgb), 0.3)'; });
        fsBtn.addEventListener('mouseout', () => { fsBtn.style.background = 'rgba(0, 0, 0, 0.6)'; fsBtn.style.boxShadow = 'none'; });
        fsBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                 document.documentElement.requestFullscreen().catch(err => { console.log(`Error: ${err.message}`); });
            } else { document.exitFullscreen(); }
        });
        
        const exitBtn = document.createElement('button');
        exitBtn.textContent = 'DISENGAGE';
        exitBtn.style.cssText = `
            background: rgba(0, 0, 0, 0.6); border: 1px solid rgba(var(--ui-rgb), 0.5); color: var(--ui-color); padding: 8px 5px;
            cursor: pointer; font-family: inherit; font-weight: bold; border-radius: 50px;
            font-size: 0.65rem; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; text-align: center;
        `;
        exitBtn.addEventListener('mouseover', () => { exitBtn.style.background = 'rgba(var(--ui-rgb), 0.2)'; exitBtn.style.boxShadow = '0 0 8px rgba(var(--ui-rgb), 0.3)'; });
        exitBtn.addEventListener('mouseout', () => { exitBtn.style.background = 'rgba(0, 0, 0, 0.6)'; fsBtn.style.boxShadow = 'none'; });
        exitBtn.addEventListener('click', () => this.close());

        navSpacer.appendChild(fsBtn);
        navSpacer.appendChild(exitBtn);
        navCol.appendChild(navSpacer);

        const contentCol = document.createElement('div');
        contentCol.style.cssText = `flex-grow: 1; padding: 25px 20px; display: flex; flex-direction: column; overflow-y: auto; background: rgba(0, 0, 0, 0.2);`;

        // --- PLANETS TAB ---
        const planetsTab = document.createElement('div');
        planetsTab.id = 'engine-tab-planets';
        planetsTab.className = 'engine-tab-panel';
        planetsTab.style.cssText = "display: flex; flex-direction: column;";
        
        const createSlider = (label, val, onChange) => {
            const container = document.createElement('div');
            container.style.cssText = "margin-bottom: 20px; background: rgba(0, 0, 0, 0.6); padding: 15px; border-radius: 30px; border: 1px solid rgba(var(--ui-rgb), 0.3);";
            const lbl = document.createElement('div'); lbl.textContent = label; lbl.style.fontSize = "0.8rem"; lbl.style.marginBottom = "8px"; lbl.style.letterSpacing = "1px";
            const slider = document.createElement('input'); slider.type = "range"; slider.min = "0"; slider.max = "1"; slider.step = "0.01"; slider.value = val;
            slider.style.width = "100%"; slider.style.accentColor = "var(--ui-color)"; slider.style.cursor = "pointer";
            slider.oninput = (e) => onChange(parseFloat(e.target.value));
            container.appendChild(lbl); container.appendChild(slider);
            return container;
        };
        
        planetsTab.appendChild(createSlider("Saturn Ring Opacity", 0.9, (v) => {
            if(this.saturnRingMat) this.saturnRingMat.opacity = v;
        }));
        planetsTab.appendChild(createSlider("Earth Clouds Opacity", 0.8, (v) => {
            if(this.earthCloudMat) this.earthCloudMat.opacity = v;
        }));

        // --- ENVIRONMENT TAB ---
        const envTab = document.createElement('div');
        envTab.id = 'engine-tab-env';
        envTab.className = 'engine-tab-panel';
        envTab.style.cssText = "display: none; flex-direction: column;";
        
        const toggleContainer = document.createElement('label');
        toggleContainer.style.cssText = "margin-bottom: 20px; display: flex; align-items: center; background: rgba(0, 0, 0, 0.6); padding: 12px 15px; border-radius: 50px; border: 1px solid rgba(var(--ui-rgb), 0.3); cursor: pointer;";
        const cb = document.createElement('input'); cb.type = 'checkbox'; cb.checked = true; cb.style.accentColor = "var(--ui-color)"; cb.style.marginRight = "15px"; cb.style.transform = "scale(1.2)"; cb.style.cursor = "pointer";
        cb.onchange = (e) => {
            const v = e.target.checked;
            if(this.mainAsteroidBelt) this.mainAsteroidBelt.visible = v;
            if(this.kuiperBelt) this.kuiperBelt.visible = v;
        };
        const cbLbl = document.createElement('span'); cbLbl.textContent = "Render Asteroid Fields"; cbLbl.style.fontSize = "0.85rem"; cbLbl.style.letterSpacing = "1px";
        toggleContainer.appendChild(cb); toggleContainer.appendChild(cbLbl);
        envTab.appendChild(toggleContainer);

        // --- SHIPS TAB ---
        const shipsTab = document.createElement('div');
        shipsTab.id = 'engine-tab-ships';
        shipsTab.className = 'engine-tab-panel';
        shipsTab.style.cssText = "display: none; flex-direction: column;";

        const createRadio = (name, value, label, checked) => {
            const container = document.createElement('label');
            container.style.cssText = "margin-bottom: 10px; display: flex; align-items: center; background: rgba(0, 0, 0, 0.6); padding: 10px 15px; border-radius: 50px; border: 1px solid rgba(var(--ui-rgb), 0.3); cursor: pointer; transition: 0.2s;";
            container.addEventListener('mouseover', () => container.style.background = 'rgba(var(--ui-rgb), 0.15)');
            container.addEventListener('mouseout', () => container.style.background = 'rgba(0, 0, 0, 0.6)');
            
            const rb = document.createElement('input'); 
            rb.type = 'radio'; rb.name = name; rb.value = value; rb.checked = checked;
            rb.style.accentColor = "var(--ui-color)"; rb.style.marginRight = "15px"; rb.style.transform = "scale(1.2)";
            rb.onchange = (e) => {
                if(e.target.checked) {
                    this.activeShip = value;
                    // Reset viewing mode for larger/different ships
                    if (value === 'falcon' || value === 'planetexpress' || value === 'benatar' || value === 'tardis' || value === 'enterprise' || value === 'saturnv' || value === 'jupiterc' || value === 'globalhawk' || value === 'shuttle' || value === 'atlasv' || value === 'nexus' || value === 'classicrocket') {
                        this.shipView = '3rd'; 
                    }
                    if (value !== 'none') {
                        this.shipGroup.position.copy(this.camera.position);
                        const shipDir = new THREE.Vector3(
                            Math.cos(this.pitch) * Math.sin(this.yaw),
                            Math.sin(this.pitch),
                            Math.cos(this.pitch) * Math.cos(this.yaw)
                        ).normalize();
                        this.shipGroup.lookAt(this.shipGroup.position.clone().add(shipDir));
                    }
                    this.updateShipVisibility();
                }
            };
            const rbLbl = document.createElement('span'); rbLbl.textContent = label; rbLbl.style.fontSize = "0.85rem"; rbLbl.style.letterSpacing = "1px";
            container.appendChild(rb); container.appendChild(rbLbl);
            return container;
        };

        shipsTab.appendChild(createRadio('ship-select', 'none', 'Godmode (None)', true));
        shipsTab.appendChild(createRadio('ship-select', 'tie', 'ADV Tie Fighter', false));
        shipsTab.appendChild(createRadio('ship-select', 'xwing', 'T-65 X-Wing', false));
        shipsTab.appendChild(createRadio('ship-select', 'falcon', 'Millennium Falcon', false));
        shipsTab.appendChild(createRadio('ship-select', 'planetexpress', 'Planet Express', false));
        shipsTab.appendChild(createRadio('ship-select', 'rickmorty', 'Space Cruiser (R&M)', false));
        shipsTab.appendChild(createRadio('ship-select', 'benatar', 'Benatar (GOTG)', false));
        shipsTab.appendChild(createRadio('ship-select', 'tardis', 'TARDIS', false));
        shipsTab.appendChild(createRadio('ship-select', 'enterprise', 'USS Enterprise', false));
        shipsTab.appendChild(createRadio('ship-select', 'globalhawk', 'Global Hawk (NASA)', false));
        shipsTab.appendChild(createRadio('ship-select', 'shuttle', 'Space Shuttle (NASA)', false)); 

        // --- ROCKETS TAB ---
        const rocketsTab = document.createElement('div');
        rocketsTab.id = 'engine-tab-rockets';
        rocketsTab.className = 'engine-tab-panel';
        rocketsTab.style.cssText = "display: none; flex-direction: column;";

        rocketsTab.appendChild(createRadio('ship-select', 'saturnv', 'Saturn V (NASA)', false));
        rocketsTab.appendChild(createRadio('ship-select', 'jupiterc', 'Jupiter-C (NASA)', false));
        rocketsTab.appendChild(createRadio('ship-select', 'atlasv', 'Atlas V (NASA)', false)); 
        rocketsTab.appendChild(createRadio('ship-select', 'nexus', 'Nexus (NASA)', false)); 
        rocketsTab.appendChild(createRadio('ship-select', 'classicrocket', 'Retro Rocket', false)); 

        // --- CONTROLS TAB ---
        const controlsTab = document.createElement('div');
        controlsTab.id = 'engine-tab-controls';
        controlsTab.className = 'engine-tab-panel';
        controlsTab.style.cssText = "display: none; flex-direction: column; gap: 10px;";

        const controlsLabel = document.createElement('div');
        controlsLabel.textContent = "FLIGHT OPERATIONS:";
        controlsLabel.style.cssText = "font-size: 0.8rem; margin-bottom: 5px; opacity: 0.8; letter-spacing: 1px;";
        controlsTab.appendChild(controlsLabel);

        const controlsList = [
            "<b>W / S</b> : Pitch Up / Down",
            "<b>A / D</b> : Yaw Left / Right",
            "<b>Q / E</b> : Roll Left / Right",
            "<b>SPACE</b> : Main Thruster",
            "<b>SHIFT</b> : Hyper Boost",
            "<b>MOUSE</b> : Free Look",
            "<b>Y</b> : Toggle 1st/3rd Person",
            "<b>D-PAD</b> : Cycle Nav Targets",
            "<b>X KEY/BTN</b> : Deploy/Return Vehicle",
            "<b>SELECT BTN</b> : Toggle Map"
        ];
        
        controlsList.forEach(ctrlText => {
            const item = document.createElement('div');
            item.innerHTML = ctrlText;
            item.style.cssText = "background: rgba(0,0,0,0.6); padding: 10px 15px; border-radius: 50px; border: 1px solid rgba(var(--ui-rgb), 0.3); font-size: 0.8rem; letter-spacing: 1px; color: #fff;";
            controlsTab.appendChild(item);
        });

        // --- SYSTEM TAB ---
        const systemTab = document.createElement('div');
        systemTab.id = 'engine-tab-system';
        systemTab.className = 'engine-tab-panel';
        systemTab.style.cssText = "display: none; flex-direction: column;";

        // UI Color Picker
        const colorLabel = document.createElement('div');
        colorLabel.textContent = "HUD COLOR THEME:";
        colorLabel.style.cssText = "font-size: 0.8rem; margin-bottom: 10px; letter-spacing: 1px; opacity: 0.8;";
        systemTab.appendChild(colorLabel);

        const colorPickerContainer = document.createElement('div');
        colorPickerContainer.style.cssText = "margin-bottom: 25px; background: rgba(0,0,0,0.6); padding: 15px 20px; border-radius: 50px; border: 1px solid rgba(var(--ui-rgb), 0.3); display: flex; align-items: center; justify-content: space-between;";
        
        const colorName = document.createElement('span');
        colorName.textContent = "Theme Accents";
        colorName.style.fontSize = "0.85rem";
        colorName.style.letterSpacing = "1px";
        
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.value = this.uiColor;
        colorInput.style.cssText = "background: transparent; border: none; cursor: pointer; width: 45px; height: 35px; padding: 0;";
        colorInput.addEventListener('input', (e) => {
            this.setUIColor(e.target.value);
        });
        
        colorPickerContainer.appendChild(colorName);
        colorPickerContainer.appendChild(colorInput);
        systemTab.appendChild(colorPickerContainer);

        // HUD Toggle
        const hudToggleBox = document.createElement('label');
        hudToggleBox.style.cssText = "margin-bottom: 25px; display: flex; align-items: center; background: rgba(0, 0, 0, 0.6); padding: 12px 15px; border-radius: 50px; border: 1px solid rgba(var(--ui-rgb), 0.3); cursor: pointer;";
        const hudCb = document.createElement('input'); 
        hudCb.type = 'checkbox'; hudCb.id = 'hud-checkbox'; hudCb.checked = true; hudCb.style.accentColor = "var(--ui-color)"; hudCb.style.marginRight = "15px"; hudCb.style.transform = "scale(1.2)";
        hudCb.onchange = (e) => {
            if (this.hudContainer && this.hudVisible) {
                this.hudContainer.style.opacity = e.target.checked ? '1' : '0';
                this.timeContainer.style.opacity = e.target.checked ? '1' : '0';
                this.timeContainer.style.pointerEvents = e.target.checked ? 'auto' : 'none';
            }
        };
        const hudCbLbl = document.createElement('span'); hudCbLbl.textContent = "Center HUD OSD"; hudCbLbl.style.fontSize = "0.85rem"; hudCbLbl.style.letterSpacing = "1px";
        hudToggleBox.appendChild(hudCb); hudToggleBox.appendChild(hudCbLbl);
        systemTab.appendChild(hudToggleBox);

        // FPS Limit Radios
        const fpsLabel = document.createElement('div');
        fpsLabel.textContent = "PERFORMANCE TARGET:";
        fpsLabel.style.fontSize = "0.8rem"; fpsLabel.style.marginBottom = "10px"; fpsLabel.style.opacity = "0.8"; fpsLabel.style.letterSpacing = "1px";
        systemTab.appendChild(fpsLabel);

        const createFpsRadio = (name, value, label, isChecked) => {
            const container = document.createElement('label');
            container.style.cssText = "margin-bottom: 10px; display: flex; align-items: center; background: rgba(0, 0, 0, 0.6); padding: 10px 15px; border-radius: 50px; border: 1px solid rgba(var(--ui-rgb), 0.3); cursor: pointer; transition: 0.2s;";
            container.addEventListener('mouseover', () => container.style.background = 'rgba(var(--ui-rgb), 0.15)');
            container.addEventListener('mouseout', () => container.style.background = 'rgba(0, 0, 0, 0.6)');
            const rb = document.createElement('input'); 
            rb.type = 'radio'; rb.name = name; rb.value = value; rb.checked = isChecked;
            rb.style.accentColor = "var(--ui-color)"; rb.style.marginRight = "15px"; rb.style.transform = "scale(1.2)";
            rb.onchange = (e) => {
                if(e.target.checked) {
                    this.targetFPS = parseInt(value);
                    localStorage.setItem('solarSystemTargetFPS', value);
                }
            };
            const rbLbl = document.createElement('span'); rbLbl.textContent = label; rbLbl.style.fontSize = "0.85rem"; rbLbl.style.letterSpacing = "1px";
            container.appendChild(rb); container.appendChild(rbLbl);
            return container;
        };

        systemTab.appendChild(createFpsRadio('fps-target', '60', '60 FPS (Standard)', this.targetFPS === 60));
        systemTab.appendChild(createFpsRadio('fps-target', '120', '120 FPS (High Refresh)', this.targetFPS === 120));

        contentCol.appendChild(planetsTab);
        contentCol.appendChild(envTab);
        contentCol.appendChild(shipsTab);
        contentCol.appendChild(rocketsTab);
        contentCol.appendChild(controlsTab);
        contentCol.appendChild(systemTab); 

        this.engineSidebar.appendChild(navCol);
        this.engineSidebar.appendChild(contentCol);

        this.engineSidebarWrapper.appendChild(this.engineSidebar);
        this.container.appendChild(this.engineSidebarWrapper);
    }
}