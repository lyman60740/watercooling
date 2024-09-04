import React, { useRef, useEffect, useState } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import {
  MeshTransmissionMaterial,
  Environment,
  OrbitControls,
} from "@react-three/drei";
import { EffectComposer, Bloom } from "@react-three/postprocessing";
import { useControls } from "leva";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";
import "./App.css";

// Enregistrer le plugin ScrollTrigger avec GSAP
gsap.registerPlugin(ScrollTrigger);

function TubeWithLiquid({ curve }) {
  const tubeRef = useRef();
  const liquidRef = useRef();
  const progressRef = useRef(0);

  const { thickness, roughness, metalness, transmission, color } = useControls(
    "Tube Material",
    {
      thickness: { value: 0, min: 0, max: 5 },
      roughness: { value: 0.13, min: 0, max: 1 },
      metalness: { value: 0.24, min: 0, max: 1 },
      transmission: { value: 1, min: 0, max: 1 },
      color: "#cc00ff",
    }
  );

  const {
    thickness: liquidThickness,
    roughness: liquidRoughness,
    metalness: liquidMetalness,
    transmission: liquidTransmission,
    ior: liquidIor,
    anisotropy: liquidAnisotropy,
    color: liquidColor,
  } = useControls("Liquid Material", {
    thickness: { value: 0.5, min: 0, max: 5 },
    roughness: { value: 0.11, min: 0, max: 1 },
    metalness: { value: 1, min: 0, max: 1 },
    transmission: { value: 0, min: 0, max: 1 },
    ior: { value: 1.5, min: 1, max: 2.333 },
    anisotropy: { value: 0.5, min: 0, max: 1 },
    color: "#00b2ff",
  });

  useEffect(() => {
    // Configuration de ScrollTrigger pour animer la progression avec le défilement
    gsap.to(progressRef, {
      current: 1,
      ease: "none",
      scrollTrigger: {
        trigger: ".watercooling-main",
        start: "top top",
        end: "bottom bottom",
        scrub: 4, // Synchroniser avec le défilement
      },
    });
  }, []);

  useFrame(() => {
    const progress = progressRef.current;
    const points = curve
      .getSpacedPoints(1000)
      .slice(0, Math.floor(1000 * progress));

    if (points.length > 1 && liquidRef.current) {
      const tubeGeometry = new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(points),
        100,
        0.031,
        20,
        false
      );
      liquidRef.current.geometry = tubeGeometry;

      // Mettre à jour l'opacité en fonction de la progression
      liquidRef.current.material.opacity = progress;
      liquidRef.current.material.transparent = progress < 1; // Rendre transparent si progress < 1
    }
  });

  return (
    <>
      {/* Tube */}
      <mesh ref={tubeRef}>
        <tubeGeometry args={[curve, 100, 0.03, 20, false]} />
        <MeshTransmissionMaterial
          thickness={thickness}
          roughness={roughness}
          metalness={metalness}
          transmission={transmission}
          color={color}
        />
      </mesh>

      {/* Liquid */}
      <mesh ref={liquidRef}>
        <MeshTransmissionMaterial
          thickness={liquidThickness}
          roughness={liquidRoughness}
          metalness={liquidMetalness}
          transmission={liquidTransmission}
          ior={liquidIor}
          anisotropy={liquidAnisotropy}
          color={liquidColor}
          opacity={1} // Opacité initiale
          transparent={true} // Activer la transparence
        />
      </mesh>
    </>
  );
}

function App() {
  const directionalLight = useControls("Directional Light", {
    x: -0.3,
    y: 0,
    z: 2.2,
  });

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (event) => {
      // Convertir la position de la souris pour être relative au centre de l'écran
      const { innerWidth, innerHeight } = window;
      const mouseX = (event.clientX / innerWidth - 0.5) * 50;
      const mouseY = (event.clientY / innerHeight - 0.5) * 50;

      setMousePosition({ x: mouseX, y: mouseY });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  const [baseColor, normalMap, roughnessMap, metalnessMap, aoMap] = useLoader(
    THREE.TextureLoader,
    [
      "/Metal_006_SD/Metal_006_basecolor.jpg",
      "/Metal_006_SD/Metal_006_normal.jpg",
      "/Metal_006_SD/Metal_006_roughness.jpg",
      "/Metal_006_SD/Metal_006_metallic.jpg",
      "/Metal_006_SD/Metal_006_ambientOcclusion.jpg",
    ]
  );

  const curves = [
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(-2, 1.5, 0),
      new THREE.Vector3(-1, -1, 0),
      new THREE.Vector3(1, 1, 0),
      new THREE.Vector3(2, -1.5, 0)
    ),
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(2, 1.5, 0),
      new THREE.Vector3(1, -1, 0),
      new THREE.Vector3(-1, 1, 0.5),
      new THREE.Vector3(-2, -1.5, 0)
    ),
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(-0.5, 1.5, 0),
      new THREE.Vector3(-1.5, -1, 1),
      new THREE.Vector3(-0.3, 1, -1),
      new THREE.Vector3(-0.3, -1.5, 0)
    ),
    new THREE.CubicBezierCurve3(
      new THREE.Vector3(0.5, 1.5, 0),
      new THREE.Vector3(1.5, -1, 1),
      new THREE.Vector3(0.3, 1, -1),
      new THREE.Vector3(0.3, -1.5, 0)
    ),
    // Ajoutez plus de courbes si nécessaire
  ];

  return (
    <div className="App">
      <Canvas
        className="canvas"
        style={{ background: "black" }}
        camera={{
          position: [0, 0, 1.8],
          fov: 75,
          near: 0.1,
          far: 1000,
        }}
        gl={{ antialias: false }}
      >
        <Environment preset="studio" />
        <directionalLight
          position={[
            directionalLight.x + mousePosition.x * 0.1,
            directionalLight.y + mousePosition.y * 0.1,
            directionalLight.z,
          ]}
          intensity={5}
          color={"#cc00ff"}
        />
        <directionalLight
          position={[0 + mousePosition.x * 0.1, 3 + mousePosition.y * 0.1, 2]}
          intensity={5}
          color={"#cc00ff"}
        />
        {/* Plane with metal texture as background */}
        {/* <mesh position={[0, 0, -10]} rotation={[0, 0, -Math.PI / 2]}>
          <planeGeometry args={[50, 50]} />
          <meshStandardMaterial
            map={baseColor}
            normalMap={normalMap}
            roughnessMap={roughnessMap}
            metalnessMap={metalnessMap}
            aoMap={aoMap}
            color={"black"}
          />
        </mesh> */}
        {curves.map((curve, index) => (
          <TubeWithLiquid key={index} curve={curve} />
        ))}
        <EffectComposer>
          <Bloom
            luminanceThreshold={0.01}
            luminanceSmoothing={0.2}
            intensity={0.1}
          />
        </EffectComposer>

        {/* <OrbitControls /> */}
      </Canvas>
    </div>
  );
}

export default App;
