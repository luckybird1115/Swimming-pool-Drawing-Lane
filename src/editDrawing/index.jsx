import React, { useEffect, useRef, useState } from 'react';
import { Canvas, useThree} from '@react-three/fiber'
import { PerspectiveCamera, Sphere } from '@react-three/drei'
import { connect } from "react-redux";
import { getValue } from '../redux/action';
import * as THREE from 'three';
import Plane from './DrawPlane'

const DrawByRayCaster = (props) => {
  const {camera, gl, raycaster, scene} = useThree();

  const planeRef = useRef();

  const [points, setPoints] = useState([]);
  const [isFinishClicking, setIsFinishClicking] = useState(false);
  const [pointsClone, setPointsClone] = useState([]);
  const handleClick = (event) => {
      if (props.isClickable) {
        raycaster.setFromCamera(
          {
            x: (event.nativeEvent.offsetX / gl.domElement.clientWidth) * 2 - 1,
            y: -(event.nativeEvent.offsetY / gl.domElement.clientHeight) * 2 + 1
          },
          camera
        );

        const intersections = raycaster.intersectObject(planeRef.current, true);
        if (intersections.length > 0) {
          const point = intersections[0].point;
          let pointArray = pointsClone;
          pointArray.push(point);
          setPointsClone([...pointArray]);

          const newSphere = (
          <mesh position={new THREE.Vector3(point.x, point.y, 0)} key={Math.random()}>
            <sphereGeometry args={[0.07, 32, 32]} />
            <meshStandardMaterial color="#ffffff" />
          </mesh>
        );
          setPoints((prevSpheres) => [...prevSpheres, newSphere]);
        }
      }
  }

  useEffect(() => {
    if (pointsClone.length === 4) {
      setIsFinishClicking(true);
    }
  }, [pointsClone])

  useEffect(() => {
    if (isFinishClicking) {
      props.returnPointArray(pointsClone);
      props.setIsClickable(!props.isClickable)
    }
  }, [isFinishClicking])

  return (
    <>
    <mesh visible={props.sceneMark} position={[0, 0, 0]} onPointerDown={handleClick} ref={planeRef} >
      <planeBufferGeometry attach="geometry" args={[100, 100]} />
      <meshBasicMaterial attach="material" color={"#000000"} transparent={true} opacity={0.4}/>
    </mesh>
    {props.showDots && points}
    </>
  );
}

const EditDrawing = (props) => {
  const {
    drawingByLaneNumber,
    drawingOuter,
    editingLaneNumber,
    state,
    previewState,
    sceneMark,
    laneNum,
    startingLane,
    endingLane,
    isClickable,
    returnPointArray,
    setIsClickable,
    drawingSystem,
    setLeftCornersArray,
    setRightCornersArray,
    setRemoveDirection,
    showDots,
    upOrDown,
  } = props;

  return (
      <Canvas>
        {/* <Camera /> */}
        {/* <PerspectiveCamera makeDefault position={[0, 0, 7]} fov={60} /> */}
        <pointLight position={[0, 0, 3]} color="#f7f3ce" intensity={0.1} />
        <ambientLight color="#fff" intensity={0.85} />
        {/* <color attach="background" args={['#000000']} /> */}
        <Plane
          drawingOuter={drawingOuter}
          drawingByLaneNumber={drawingByLaneNumber}
          editingLaneNumber={editingLaneNumber}
          state={state}
          previewState={previewState}
          sceneMark={sceneMark}
          laneNum={laneNum}
          startingLane={startingLane}
          endingLane={endingLane}
          drawingSystem={drawingSystem}
          setLeftCornersArray={setLeftCornersArray}
          setRightCornersArray={setRightCornersArray}
          setRemoveDirection={setRemoveDirection}
          upOrDown={upOrDown}
        />
        <DrawByRayCaster 
          isClickable={isClickable}
          sceneMark={sceneMark}
          returnPointArray={returnPointArray}
          setIsClickable={setIsClickable}
          previewState={previewState}
          showDots={showDots}
        />
      </Canvas>
  )
}

const mapStateToProps = state => {
  return { addShape: state.addShape };
};

const mapDispatchToProps = {
  getValue
};

export default connect(mapStateToProps, mapDispatchToProps)(EditDrawing);