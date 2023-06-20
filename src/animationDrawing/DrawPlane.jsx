import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useThree, useFrame, useLoader } from '@react-three/fiber'
import * as THREE from 'three'
import { Line2 } from "three/examples/jsm/lines/Line2"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry"
import { extend } from '@react-three/fiber'
import { Text, Image, GradientTexture } from '@react-three/drei'
import Spline from './SplineCurve';
import { connect } from "react-redux";
import { getValue } from '../redux/action';

extend({ LineMaterial, LineGeometry, Line2 })
const canvasWidth = 1280;
const canvasHeight = 720;
const fontUrl = './font/OpenSans-Medium.ttf'

const CurveString = ({ curvePoints, pos, laneWidth, text, index, anchorX, anchorY, size, visibility, visibleValue, orientation, isDegree, isAnimation=false}) => {
  const [textArray, setTextArray] = useState([]);
  const groupRef = useRef();
  useEffect(() => {
    if (String(text).length === 1) {
      setTextArray([text]);
    } else if (text.length > 1) {
      let arr = text.split('');
      if ((orientation === 'ltr') && (textArray.length !== 0)) setTextArray(arr.reverse());
      else setTextArray(arr);
    } else return;
  }, [curvePoints])

  return (
    <group ref={groupRef}>
      { orientation === 'rtl' && textArray.map((txt, ind) => {
        return (
          <CurveText
            key={ind}
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={pos + 0.055 * ind * laneWidth * 0.45}
            index={index}
            row={ind}
            anchorX={anchorX}
            anchorY={anchorY}
            size={size}
            text={txt}
            visibility={visibility}
            visibleVal={visibleValue}
            orientation={orientation}
            isDegree={isDegree}
          />
        )
      })}
      { isDegree && textArray.map((txt, ind) => {
        return (
          <CurveText
            key={ind}
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={pos}
            index={index}
            row={ind}
            anchorX={anchorX}
            anchorY={anchorY}
            size={size}
            text={txt}
            visibility={visibility}
            visibleVal={visibleValue}
            orientation={orientation}
            isDegree={isDegree}
          />
        )
      })}
      { orientation === 'ltr' && textArray.map((txt, ind) => {
        return (
          <CurveText
            key={ind}
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={pos - 0.055 * ind * laneWidth * 0.45}
            index={index}
            row={ind}
            anchorX={anchorX}
            anchorY={anchorY}
            size={size}
            text={txt}
            visibility={visibility}
            visibleVal={visibleValue}
            orientation={orientation}
            isDegree={isDegree}
            isAnimation={isAnimation}
          />
        )
      })}
    </group>
  );
}

const CurveText = ({ curvePoints, pos, laneWidth, text, index, row, anchorX, anchorY, size, visibility, visibleVal, orientation, isDegree, isAnimation}) => {
  const [visibleValue, setVisibleValue] = useState(false);
  const [oriVal, setOriVal] = useState(0);
  const textRef = useRef();
  useEffect(() => {
    if (!isAnimation) {
      if (orientation === 'rtl') {
        if(visibleVal > 0) {
          if (textRef.current.position.x < visibility + visibleVal) setVisibleValue(false);
          else setVisibleValue(true);
        } else {
          if (textRef.current.position.x > visibility + visibleVal) setVisibleValue(false);
          else setVisibleValue(true);
        }
        setOriVal(0);
      } else {
        if(visibleVal < 0) {
          if (textRef.current.position.x > visibility + visibleVal) setVisibleValue(false);
          else setVisibleValue(true);
        } else {
          if (textRef.current.position.x < visibility + visibleVal) setVisibleValue(false);
          else setVisibleValue(true);
        }
        setOriVal(0.3);
      }
    }
    
    
  }, [orientation, isAnimation]);

  useEffect(() => {
    if (orientation === 'rtl') {
      if (Math.abs(pos) <= 1) {
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const point = curve.getPointAt(pos); // Position the group at the midpoint of the curve
        let posY = point.y - laneWidth / 2 - (8 - index) * 0.03
        textRef.current.position.set(point.x + laneWidth * 0.13 * row + oriVal + laneWidth * 0.3, posY + laneWidth * 0.08, point.z + 0.4);
        const tangent = curve.getTangentAt(pos);
        textRef.current.rotation.z = Math.atan2(tangent.y, tangent.x);
        textRef.current.rotation.x = -0.5;
        textRef.current.rotation.y = 0;
      }

      if (visibleVal > 0) {
        if (textRef.current.position.x < visibility  + visibleVal) setVisibleValue(false);
        else setVisibleValue(true);
      } else {
        if (textRef.current.position.x > visibility  + visibleVal) setVisibleValue(false);
        else setVisibleValue(true); 
      }
    } else {
      if (!isAnimation) textRef.current.scale.z *= -1;
      if (Math.abs(pos) <= 1) { 
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const point = curve.getPointAt(pos); // Position the group at the midpoint of the curve
        let posY = point.y - laneWidth / 2 - (8 - index) * 0.03
        if (isDegree) textRef.current.position.set(point.x + laneWidth * 0.1, posY + laneWidth * 0.08, point.z + 0.4);
        else if (!isAnimation) textRef.current.position.set(point.x - laneWidth * 0.13 * row - oriVal - laneWidth * 0.1, posY + laneWidth * 0.08, point.z + 0.4);
        else if (isAnimation) {
          textRef.current.position.set(point.x + laneWidth * 0.06, posY + laneWidth * 0.08, point.z + 0.4);
        }
        const tangent = curve.getTangentAt(pos);
        textRef.current.rotation.z = Math.atan2(tangent.y, tangent.x);
        textRef.current.rotation.x = -0.5;
        textRef.current.rotation.y = 0;
      }

      if (visibleVal > 0) {
        if (textRef.current.position.x > visibility  + visibleVal) setVisibleValue(false);
        else setVisibleValue(true);
      } else {
        if (textRef.current.position.x < visibility  + visibleVal) setVisibleValue(false);
        else setVisibleValue(true);
      }
    }
    
  }, [curvePoints, orientation]);
  
  var fontSize = laneWidth * size * 0.7;

  return (
    <>
      {
        !isAnimation?
        <Text
          ref={textRef}
          font={fontUrl}
          fontSize={fontSize}
          fontWeight="bold"
          color="white"
          anchorX={anchorX}
          anchorY={anchorY}
          scale={[1.3, 1, 1]}
          visible={visibleValue}
        >
          {text}
        </Text>:
        <Text
          ref={textRef}
          font={fontUrl}
          fontSize={fontSize}
          fontWeight="bold"
          color="white"
          anchorX={anchorX}
          anchorY={anchorY}
          scale={[-1.3, -1, 1]}
          visible={visibleValue}
        >
          {text}
        </Text>
      }
    </>
  );
};

function Mark({ curvePoints, laneWidth, pos, index, visibility, orientation}) {
  const [visibleValue, setVisibleValue] = useState(false);
  const markRef = useRef();

  useEffect(() => {
    if (orientation === 'rtl') {
      if (markRef.current.position.x > visibility - 2.5) setVisibleValue(false);
      else setVisibleValue(true);
    } else {
      if (markRef.current.position.x < visibility - 5) setVisibleValue(false);
      else setVisibleValue(true);
    }
    
  }, []);

  useEffect(() => {
    if (pos <= 1) {
      if (orientation === 'rtl') {
        const curve = new THREE.CatmullRomCurve3(curvePoints);
        const point = curve.getPointAt(pos); // Position the group at the midpoint of the curve
        let posY = point.y - laneWidth / 2 - (8 - index) * 0.03
        markRef.current.position.set(point.x + laneWidth * 0.5, posY + laneWidth * 0.05, point.z + 0.4);
        const tangent = curve.getTangentAt(pos);
        markRef.current.rotation.z = Math.atan2(tangent.y, tangent.x);
        markRef.current.rotation.x = -0.5;
        markRef.current.rotation.y = 0;
        var markSize = laneWidth / 7;
        markRef.current.scale.set(markSize * 5, markSize * 3, markSize * 3);
      } else {
        let reverseArray = curvePoints;
        reverseArray = reverseArray.reverse();
        const curve = new THREE.CatmullRomCurve3(reverseArray);
        const point = curve.getPointAt(pos); // Position the group at the midpoint of the curve
        let posY = point.y - laneWidth / 2 - (8 - index) * 0.03
        markRef.current.position.set(point.x - laneWidth * 0.6, posY + laneWidth * 0.05, point.z + 0.4);
        const tangent = curve.getTangentAt(pos);
        markRef.current.rotation.z = Math.atan2(tangent.y, tangent.x);
        markRef.current.rotation.x = -0.5;
        markRef.current.rotation.y = 0;
        var markSize = laneWidth / 7;
        markRef.current.scale.set(markSize * 5, markSize * 3, markSize * 3);
      }
    }
    if (orientation === 'rtl') {
      if (markRef.current.position.x > visibility - 2.5) setVisibleValue(false);
      else setVisibleValue(true);
    } else {
      if (markRef.current.position.x < visibility - 2.5) setVisibleValue(false);
      else setVisibleValue(true);
    }
  }, [curvePoints]);
  
  return (
    <group ref={markRef} visible={visibleValue} >
      <Image url="./svg/mark.png" transparent/>
    </group>
  )
}

const Rect = (leftConners, rightCorners, curves) => {
  let topCurve = new THREE.CatmullRomCurve3(curves[0].points);
  let topPoints = topCurve.getSpacedPoints(100);
  let downCurve = new THREE.CatmullRomCurve3(curves[1].points);
  let downPoints = downCurve.getSpacedPoints(100);
  const RectShape = new THREE.Shape();
  RectShape.moveTo(rightCorners[1].x, rightCorners[1].y);
  for (let i = downPoints.length - 1; i >= 0; i--) {
    RectShape.lineTo(downPoints[i].x, downPoints[i].y);
  }
  RectShape.lineTo(leftConners[0].x, leftConners[0].y);
  for (let i = 0; i < topPoints.length; i++) {
    RectShape.lineTo(topPoints[i].x, topPoints[i].y);
  }
  RectShape.lineTo(rightCorners[1].x, rightCorners[1].y);
  return RectShape
}

const NumberRect = (leftConners, percent, curves, isAnimation = false) => {

  let topCurve = new THREE.CatmullRomCurve3(curves[0].points);
  let topPoints = topCurve.getSpacedPoints(100);
  topPoints.forEach(point => {
    point.y -= 0.02;
  })

  topCurve = new THREE.CatmullRomCurve3(curves[0].points);
  let downCurve = new THREE.CatmullRomCurve3(curves[1].points);
  let downPoints = downCurve.getSpacedPoints(100);
  downPoints.forEach(point => {
    point.y += 0.02;
  })
  
  downCurve = new THREE.CatmullRomCurve3(curves[1].points);
  const RectShape = new THREE.Shape();

  RectShape.moveTo(leftConners[0].x, leftConners[0].y);
  for (let i = 0; i <= percent; i++) {
    RectShape.lineTo(topPoints[i].x, topPoints[i].y);
  }
  RectShape.lineTo(downPoints[percent].x, downPoints[percent].y);
  for (let i = percent - 1; i >= 0; i--) {
    RectShape.lineTo(downPoints[i].x, downPoints[i].y);
  }
  RectShape.lineTo(leftConners[0].x, leftConners[0].y);
  return RectShape
}

const NumberRectLeft = (rightCorners, percent, curves) => {
  let topCurve = new THREE.CatmullRomCurve3(curves[0].points);
  let topPoints = topCurve.getSpacedPoints(100);
  topPoints.forEach(point => {
    point.y -= 0.02;
  })
  topCurve = new THREE.CatmullRomCurve3(curves[0].points);
  let downCurve = new THREE.CatmullRomCurve3(curves[1].points);
  let downPoints = downCurve.getSpacedPoints(100);
  downPoints.forEach(point => {
    point.y += 0.02;
  })
  downCurve = new THREE.CatmullRomCurve3(curves[1].points);
  const RectShape = new THREE.Shape();

  RectShape.moveTo(rightCorners[0].x, rightCorners[0].y);
  for (let i = 0; i <= percent; i++) {
    RectShape.lineTo(topPoints[100 - i].x, topPoints[100 - i].y);
  }
  RectShape.lineTo(downPoints[100 - percent].x, downPoints[100 - percent].y);
  for (let i = percent - 1; i >= 0; i--) {
    RectShape.lineTo(downPoints[100 - i].x, downPoints[100 - i].y);
  }
  RectShape.lineTo(rightCorners[0].x, rightCorners[0].y);
  return RectShape
}

const GradientBox = ({rect, leftConners, rightCorners, curves, editingLaneNumber, laneNumberStr, orientation}) => {
  const canvasRef = useRef();
  const canvas = document.createElement('canvas');
  const gradientWidth = 10;
  const gradientHeight = 10;
  canvas.width = gradientWidth;
  canvas.height = gradientHeight;
  const ctx = canvas.getContext('2d');
  useMemo(() => {
    const gradient = ctx.createLinearGradient(0, 0, gradientWidth * 1.2, 0);
    if (orientation === 'rtl') {
      gradient.addColorStop(0, '#014f8a');
      gradient.addColorStop(1, 'transparent');
    } else {
      gradient.addColorStop(1, '#0d5083');
      gradient.addColorStop(0, 'transparent');
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, gradientWidth, gradientHeight);
    canvasRef.current = canvas;
  })
  return (
    <mesh position={[0, 0, -0.05]}>
      <shapeGeometry attach="geometry" args={[rect(leftConners, rightCorners, curves)]} />
      <meshPhongMaterial attach='material' opacity={0.4} transparent={true} map={new THREE.CanvasTexture(canvasRef.current)} />
    </mesh>
  )
}

const Lane = (props) => {

  const [leftCorners, setLeftCorners] = useState(props.lane[2].points);
  const [rightCorners, setRightCorners] = useState(props.lane[3].points);
  const [curves, setCurves] = useState([props.lane[0], props.lane[1]]);
  const [curvePoints, setCurvePoints] = useState(props.lane[0].points);
  const [laneWidth, setLaneWidth] = useState('')

  useEffect(() => {
    if (props.lane) {
      setLeftCorners(props.lane[2].points);
      setRightCorners(props.lane[3].points);
      setCurves([props.lane[0], props.lane[1]]);
      setCurvePoints(props.lane[0].points);
      setLaneWidth(props.lane[0].points[0].y - props.lane[1].points[0].y);
    }
  }, [props.lane])

  const m_lane = props.lane;
  const m_index = props.index;
  const laneRef = useRef();
  const bodyRef = useRef();

  return (
    <group ref={laneRef}>
      {
        m_lane.map((e, ind) =>
          <Spline key={ind} curve_points={e.points}/>
        )
      }
      <group ref={bodyRef}>
      <GradientBox rect={Rect} leftConners={leftCorners} rightCorners={rightCorners} curves={curves} orientation={props.orientation}/>
      {
        props.isAnimation && 
        <>
          <mesh>
            <shapeGeometry args={[NumberRect(leftCorners, 15, curves, props.isAnimation)]}/>
            <meshStandardMaterial color={'#00306b'} opacity={0.5} transparent={true} />
          </mesh>
          <CurveString
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={0.05}
            index={m_index + 1}
            text={props.upOrDown?m_index + Number(props.startingLane):Number(props.endingLane) - m_index }
            anchorX={"right"}
            anchorY={"middle"}
            size={1.1}
            // visibility={props.visibility}
            orientation={props.orientation}
            isAnimation={props.isAnimation}
          />
        </>
      }
      {props.orientation === 'rtl'? 
        <>
          {
            props.isAnimation?
            <Mark 
              curvePoints={curvePoints}
              laneWidth={laneWidth}
              pos={0.18}
              index={m_index + 1}
              orientation={props.orientation}
            />:
            <Mark 
              curvePoints={curvePoints}
              laneWidth={laneWidth}
              pos={0.18}
              index={m_index + 1}
              visibility={props.visibility}
              orientation={props.orientation}
            />
          }
          {
            props.isAnimation? 
            <CurveString
              curvePoints={curvePoints}
              laneWidth={laneWidth}
              pos={0.3}
              index={m_index + 1}
              text={"LANE" + (props.upOrDown?m_index + Number(props.startingLane):Number(props.endingLane) - m_index ) + "SWIMMER"}
              anchorX={"center"}
              anchorY={"middle"}
              size={0.7}
              // visibleValue={props.limitText}
              orientation={props.orientation}
            />: 
            <CurveString
              curvePoints={curvePoints}
              laneWidth={laneWidth}
              pos={0.3}
              index={m_index + 1}
              text={"LANE" + (props.upOrDown?m_index + Number(props.startingLane):Number(props.endingLane) - m_index ) + "SWIMMER"}
              anchorX={"center"}
              anchorY={"middle"}
              size={0.7}
              visibility={props.visibility}
              visibleValue={props.limitText}
              orientation={props.orientation}
            />
          }
        </>
        :
        <>
          <Mark 
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={0.8}
            index={m_index + 1}
            visibility={0}
            orientation={props.orientation}
          />
          <CurveString
            curvePoints={curvePoints}
            laneWidth={laneWidth}
            pos={0.65}
            index={m_index + 1}
            text={"LANE" + (props.upOrDown?m_index + Number(props.startingLane):Number(props.endingLane) - m_index ) + "SWIMMER"}
            anchorX={"center"}
            anchorY={"middle"}
            size={0.7}
            visibility={props.visibility}
            // visibleValue={props.limitText}
            orientation={props.orientation}
            isDegree={false}
          />
        </>
      }
      </group>
    </group>
  )
}

const Degree = (props) => {
  const [leftCorners, setLeftCorners] = useState(props.lane[2].points);
  const [rightCorners, setRightCorners] = useState(props.lane[3].points);
  const [curves, setCurves] = useState([props.lane[0], props.lane[1]]);
  const [curvePoints, setCurvePoints] = useState(props.lane[0].points);
  const [laneWidth, setLaneWidth] = useState('');
  const [visibleValue, setVisibleVale] = useState('');
  const [posVal, setPosVal] = useState('');

  useEffect(() => {
    if (props.lane) {
      setLeftCorners(props.lane[2].points);
      setRightCorners(props.lane[3].points);  
      setCurves([props.lane[0], props.lane[1]]);
      setCurvePoints(props.lane[0].points);
      setLaneWidth(props.lane[0].points[0].y - props.lane[1].points[0].y);
    }
  }, [props.lane])

  useEffect(() => {
      if (props.orientation === 'rtl') {
        setPosVal(0.06);
        setVisibleVale(0.4);
      }
      else {
        setPosVal(0.06)
        setVisibleVale(9);
      }
  }, [props.orientation, props.isAnimation])

  const m_lane = props.lane;
  const m_index = props.index;
  const laneRef = useRef();
  const bodyRef = useRef();

  return (
    <group ref={laneRef}>
      {
        m_lane.map((e, ind) =>
          <Spline key={ind} curve_points={e.points}/>
        )
      }
      <group ref={bodyRef}>
      <mesh>
        <shapeGeometry args={props.orientation === 'rtl'?[NumberRect(leftCorners, 15, curves)]:[NumberRectLeft(rightCorners, 100, curves)]}/>
        <meshStandardMaterial color={'#6e2243'} opacity={0.5} transparent={true} />
      </mesh>
      {props.orientation === 'rtl'?
        <CurveString
          curvePoints={curvePoints}
          laneWidth={laneWidth}
          pos={0.06}
          index={m_index + 1}
          text={props.upOrDown?m_index + Number(props.startingLane):Number(props.endingLane) - m_index }
          anchorX={"right"}
          anchorY={"middle"}
          size={1.1}
          visibility={props.visibility}
          visibleValue={visibleValue}
          orientation={props.orientation}
        />:
        <CurveString
          curvePoints={curvePoints}
          laneWidth={laneWidth}
          pos={0.25}
          index={m_index + 1}
          text={props.upOrDown?m_index + Number(props.startingLane):Number(props.endingLane) - m_index }
          anchorX={"center"}
          anchorY={"middle"}
          size={1.1}
          visibility={props.visibility}
          visibleValue={visibleValue}
          orientation={props.orientation}
          isDegree={true}
        />
      }
      </group>
    </group>
  )
}

const Plane = (props) => {
  
  const [laneArray, setLaneArray] = useState([]);
  const [laneArrayNum, setLaneArrayNum] = useState([]);
  const [limitText, setLimitText] = useState([]);
  const [time, setTime] = useState(props.time);
  const [isAnimation, setIsAnimation] = useState(props.isAnimation);
  const laneRef = useRef();

  useEffect(() => {
    let maskValueArray = [];
    if (props.orientation === 'rtl') {
      for (let index = 0; index < props.laneNumber; index++) {
        maskValueArray.push(-1.5);
      }
    } else {
      for (let index = 0; index < props.laneNumber; index++) {
        maskValueArray.push(-10);
      }
    }
    setLimitText(maskValueArray);
  }, [])

  useEffect(() => {
    if (!props.swimEndPreview) {
      if ((props.orientation === 'rtl') && !props.isAnimation) {
        let t = time;
        let m_laneArray = [];
        let m_laneArray_num = [];
        let curveArray = [];
        for (let index = 0; index < props.laneNumber; index++) {
          let n_laneArray = [];
          let n_laneArray_num = [];
          let lane = {};
          let lane_num = {};
          let up = [];
          let up_num = [];
          let up_add = [];
          
          // up position
          up.push(props.addShape.leftCorners[index]);
          up.push(props.addShape.controls.first[index]);
          up.push(props.addShape.controls.second[index]);
          up.push(props.addShape.rightCorners[index]);
  
          up_add.push(new THREE.Vector3(props.addShape.rightCorners[index].x, props.addShape.rightCorners[index].y, props.addShape.rightCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.rightCorners[index].x + 3, props.addShape.rightCorners[index].y, props.addShape.rightCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.rightCorners[index].x + 6, props.addShape.rightCorners[index].y, props.addShape.rightCorners[index].z));
  
          // up_num position
          up_num.push(props.addShape.leftCorners[index]);
          up_num.push(props.addShape.controls.first[index]);
          up_num.push(props.addShape.controls.second[index]);
          up_num.push(props.addShape.rightCorners[index]);
  
          // array for curve
          curveArray.push({points: [props.addShape.leftCorners[index], props.addShape.controls.first[index] , props.addShape.controls.second[index], props.addShape.rightCorners[index]]})
          let upCurvePre = new THREE.CatmullRomCurve3(up);
          up[0] = upCurvePre.getPoint(0.1);
          upCurvePre = new THREE.CatmullRomCurve3(up);
          let point1 = upCurvePre.getPoints(50);
          let up_addCurve = new THREE.CatmullRomCurve3(up_add);
          let point2 = up_addCurve.getPoints(50);
          let point = point1.concat(point2);
          let upCurve = new THREE.CatmullRomCurve3(point);
          
          // 
          let upCurve_num = new THREE.CatmullRomCurve3(up_num);
  
          // for meeting the starting point
          // let upLeftPoint = upCurve.getPoint(0.1);
          // up[0] = upLeftPoint;
          let upPoints = upCurve.getSpacedPoints(100);
  
          //
          let upLeftPoint_num = upCurve_num.getPoint(0.1);
          up_num[0] = upLeftPoint_num;
          let upPoints_num = upCurve_num.getSpacedPoints(100);
          up_num = [];
  
          // first position
          up = [];
          let firstPosition;
          if (index * 10 >= t) firstPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) firstPosition = Math.floor(100 - (t - 10 * index) * 10);
          else if (((index + 1) * 10) <= t ) firstPosition = 0;
          up.push(upPoints[firstPosition]);
  
          // second position
          let secondPosition;
          if (index * 10 >= t) secondPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) secondPosition = Math.floor(100 - (t - 10 * index) * 8);
          else if (((index + 1) * 10) <= t ) secondPosition = 20;
          up.push(upPoints[secondPosition]);
  
          // third position
          let thirdPosition;
          if (index * 10 >= t) thirdPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) thirdPosition = Math.floor(100 - (t - 10 * index) * 6);
          else if (((index + 1) * 10) <= t ) thirdPosition = 40;
          up.push(upPoints[thirdPosition]);
  
          // last position
          let lastPosition;
          if (index * 10 >= t) lastPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) lastPosition = Math.floor(100 - (t - 10 * index) * 4);
          else if (((index + 1) * 10) <= t ) lastPosition = 60;
          up.push(upPoints[lastPosition]);
  
          // up.push(props.addShape.rightCorners[index]);
          lane.points = up;
          n_laneArray.push(lane);
          lane = {};
  
          //
          let lastPosition_num; 
          if ((index + 1) * 10 >= t) lastPosition_num = 0;
          else if ((((index + 1) * 10) < t) && ((((index + 1) + 1) * 10 ) > t)) lastPosition_num = Math.floor((t - 10 * ((index + 1))) * 10);
          else if ((((index + 1) + 1) * 10) <= t ) lastPosition_num = 100;
  
          //
          let firstPosition_num = upPoints_num[0];
          up_num.push(firstPosition_num);
  
          // 
          let secondPosition_num
          if (lastPosition_num === 0) secondPosition_num = 0;
          else secondPosition_num = Math.floor(lastPosition_num / 3);
          up_num.push(upPoints_num[secondPosition_num]);
  
          //
          let thirdPosition_num;
          if (lastPosition_num === 0) thirdPosition_num = 0;
          else thirdPosition_num = Math.floor(lastPosition_num * 2 / 3);
          up_num.push(upPoints_num[thirdPosition_num]);
  
          up_num.push(upPoints_num[lastPosition_num]);
  
          lane_num.points = up_num;
          n_laneArray_num.push(lane_num);
          lane_num = {};
  
          let down = [];
          let down_num = [];
          let down_add = [];
  
          // down position
          down.push(props.addShape.leftCorners[index + 1]);
          down.push(props.addShape.controls.first[index + 1]);
          down.push(props.addShape.controls.second[index + 1]);
          down.push(props.addShape.rightCorners[index + 1]);
  
          down_add.push(props.addShape.rightCorners[index + 1])
          down_add.push(new THREE.Vector3(props.addShape.rightCorners[index + 1].x + 3, props.addShape.rightCorners[index + 1].y, props.addShape.rightCorners[index + 1].z))
          down_add.push(new THREE.Vector3(props.addShape.rightCorners[index + 1].x + 6, props.addShape.rightCorners[index + 1].y, props.addShape.rightCorners[index + 1].z))
  
          //
          down_num.push(props.addShape.leftCorners[index + 1]);
          down_num.push(props.addShape.controls.first[index + 1]);
          down_num.push(props.addShape.controls.second[index + 1]);
          down_num.push(props.addShape.rightCorners[index + 1]);
  
          // last position
          if (index === props.laneNumber - 1) curveArray.push({points: [props.addShape.leftCorners[index + 1], props.addShape.controls.first[index + 1], props.addShape.controls.second[index + 1], props.addShape.rightCorners[index + 1]]})
          
          // down curve
          let downCurvePre = new THREE.CatmullRomCurve3(down);
          down[0] = downCurvePre.getPoint(0.1);
          downCurvePre = new THREE.CatmullRomCurve3(down);
          let point3 = downCurvePre.getPoints(50);
          let downCurve_add = new THREE.CatmullRomCurve3(down_add);
          let point4 = downCurve_add.getPoints(50);
          let point5 = point3.concat(point4);
          let downCurve = new THREE.CatmullRomCurve3(point5);
          
          // 
          let downCurve_num = new THREE.CatmullRomCurve3(down_num);
  
          // let downLeftPoint = downCurve.getPoint(0.1);
          // down[0] = downLeftPoint
  
          // down positions
          let downPoints = downCurve.getSpacedPoints(100);
          down = [];
  
          //
          let downLeftPoint_num = downCurve_num.getPoint(0.1);
          down_num[0] = downLeftPoint_num;
          let downPoints_num = downCurve_num.getSpacedPoints(100);
          down_num = [];
  
          // first down point
          if (index * 10 >= t) firstPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) firstPosition = Math.floor(100 - (t - 10 * index) * 10);
          else if (((index + 1) * 10) <= t ) firstPosition = 0;
          down.push(downPoints[firstPosition]);
  
          // second down point
          if (index * 10 >= t) secondPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) secondPosition = Math.floor(100 - (t - 10 * index) * 8);
          else if (((index + 1) * 10) <= t ) secondPosition = 20;
          down.push(downPoints[secondPosition]);
  
          // third down point
          if (index * 10 >= t) thirdPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) thirdPosition = Math.floor(100 - (t - 10 * index) * 6);
          else if (((index + 1) * 10) <= t ) thirdPosition = 40;
          down.push(downPoints[thirdPosition]);
  
          // last down point
          if (index * 10 >= t) lastPosition = 100;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) lastPosition = Math.floor(100 - (t - 10 * index) * 4);
          else if (((index + 1) * 10) <= t ) lastPosition = 60;
          down.push(downPoints[lastPosition]);
          
          
          // down.push(props.addShape.rightCorners[index + 1]);
          lane.points = down;
          n_laneArray.push(lane);
  
          //
          if ((index + 1) * 10 >= t) lastPosition_num = 0;
          else if ((((index + 1) * 10) < t) && ((((index + 1) + 1) * 10 )> t)) lastPosition_num = Math.floor((t - 10 * (index + 1)) * 10);
          else if ((((index + 1) + 1) * 10) <= t ) lastPosition_num = 100;
  
          //
          firstPosition_num = downPoints_num[0];
          down_num.push(firstPosition_num);
  
          //
          if (lastPosition_num === 0) secondPosition_num = 0;
          else secondPosition_num = Math.floor(lastPosition_num / 3);
          down_num.push(downPoints_num[secondPosition_num]);
  
          // 
          if (lastPosition_num === 0) thirdPosition_num = 0;
          else thirdPosition_num = Math.floor(lastPosition_num * 2 / 3);
          down_num.push(downPoints_num[thirdPosition_num]);
  
          down_num.push(downPoints_num[lastPosition_num]);
  
          lane_num.points = down_num;
          n_laneArray_num.push(lane_num);
          lane_num = {};
  
          // left elemnt for lane
          lane = {};
          let left = [];
          left.push(up[0]);
          left.push(down[0]);
          lane.points = left;
          n_laneArray.push(lane);
  
          //
          lane_num = {};
          let left_num = [];
          left_num.push(up_num[0]);
          left_num.push(down_num[0]);
          lane_num.points = left_num;
          n_laneArray_num.push(lane_num);
  
  
          // right element for lane
          lane = {};
          let right = [];
          right.push(up[3]);
          right.push(down[3]);
          lane.points = right;
          n_laneArray.push(lane);
  
          //
          lane_num = {};
          let right_num = [];
          right_num.push(up_num[3]);
          right_num.push(down_num[3]);
          lane_num.points = right_num;
          n_laneArray_num.push(lane_num);
  
          // conclusion
          lane = {};
          lane_num = {};
          m_laneArray.push(n_laneArray);
          m_laneArray_num.push(n_laneArray_num);
  
          // change the mask limitValue along the time in previous lane time
          // if ((((index + 1) + 1) * 10) <= t ) {
          //   let changedMaskValue = limitText;
          //   changedMaskValue[index] = 2 + t / 70;
          //   if (changedMaskValue[index] > 0) changedMaskValue[index] = 0
          //   setLimitText(changedMaskValue);
          // }
          
        }
        setLaneArray(m_laneArray);
        setLaneArrayNum(m_laneArray_num);
      } else if ((props.orientation === 'rtl') && props.isAnimation){
        let t = time;
        let m_laneArray = [];
        let curveArray = [];
        for (let index = 0; index < props.laneNumber; index++) {
          let n_laneArray = [];
          let lane = {};
          let up = [];
          let up_add = [];
          
          // up position
          up.push(props.addShape.leftCorners[index]);
          up.push(props.addShape.controls.first[index]);
          up.push(props.addShape.controls.second[index]);
          up.push(props.addShape.rightCorners[index]);
  
          up_add.push(new THREE.Vector3(props.addShape.rightCorners[index].x, props.addShape.rightCorners[index].y, props.addShape.rightCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.rightCorners[index].x + 3, props.addShape.rightCorners[index].y, props.addShape.rightCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.rightCorners[index].x + 6, props.addShape.rightCorners[index].y, props.addShape.rightCorners[index].z));
  
          // array for curve
          // curveArray.push({points: [props.addShape.leftCorners[index], props.addShape.controls.first[index] , props.addShape.controls.second[index], props.addShape.rightCorners[index]]})
          let upCurvePre = new THREE.CatmullRomCurve3(up);
          up[0] = upCurvePre.getPoint(0.1);
          upCurvePre = new THREE.CatmullRomCurve3(up);
          let point1 = upCurvePre.getPoints(50);
          let up_addCurve = new THREE.CatmullRomCurve3(up_add);
          let point2 = up_addCurve.getPoints(50);
          let point = point1.concat(point2);
          let upCurve = new THREE.CatmullRomCurve3(point);

          let upPoints = upCurve.getSpacedPoints(100);
  
          // first position
          up = [];
          let firstPosition;
          if (20 > t) firstPosition = 100;
          else if ((20 <= t) && (40 > t)) firstPosition = Math.floor(100 - (t - 20) * 100 / 20);
          else if ((40 <= t) && (80 > t)) firstPosition = 0;
          else if ((80 <= t) && (90 > t)) firstPosition = Math.floor((t - 80) * 100 / 10);
          else if (90 <= t) firstPosition = 100;
          up.push(upPoints[firstPosition]);
  
          // second position
          let secondPosition;
          if (20 > t) secondPosition = 100;
          else if ((20 <= t) && (40 > t)) secondPosition = Math.floor(100 - (t - 20) * 80 / 20);
          else if ((40 <= t) && (80 > t)) secondPosition = 20;
          else if ((80 <= t) && (90 > t)) secondPosition = Math.floor(20 + (t - 80) * 80 / 10);
          else if (90 <= t) secondPosition = 100;
          up.push(upPoints[secondPosition]);
  
          // third position
          let thirdPosition;
          if (20 > t) thirdPosition = 100;
          else if ((20 <= t) && (40 > t)) thirdPosition = Math.floor(100 - (t - 20) * 60 / 20);
          else if ((40 <= t) && (80 > t)) thirdPosition = 40;
          else if ((80 <= t) && (90 > t)) thirdPosition = Math.floor(40 + (t - 80) * 60 / 10);
          else if (90 <= t) thirdPosition = 100;
          up.push(upPoints[thirdPosition]);
  
          // last position
          let lastPosition;
          if (20 > t) lastPosition = 100;
          else if ((20 <= t) && (40 > t)) lastPosition = Math.floor(100 - (t - 20) * 40 / 20);
          else if ((40 <= t) && (80 > t)) lastPosition = 60;
          else if ((80 <= t) && (90 > t)) lastPosition = Math.floor(60 + (t - 80) * 40 / 10);
          else if (90 <= t) lastPosition = 100;
          up.push(upPoints[lastPosition]);

          lane.points = up;
          n_laneArray.push(lane);
          lane = {};
  
          let down = [];
          let down_add = [];
  
          // down position
          down.push(props.addShape.leftCorners[index + 1]);
          down.push(props.addShape.controls.first[index + 1]);
          down.push(props.addShape.controls.second[index + 1]);
          down.push(props.addShape.rightCorners[index + 1]);
  
          down_add.push(props.addShape.rightCorners[index + 1])
          down_add.push(new THREE.Vector3(props.addShape.rightCorners[index + 1].x + 3, props.addShape.rightCorners[index + 1].y, props.addShape.rightCorners[index + 1].z))
          down_add.push(new THREE.Vector3(props.addShape.rightCorners[index + 1].x + 6, props.addShape.rightCorners[index + 1].y, props.addShape.rightCorners[index + 1].z))
  
          // last position
          // if (index === props.laneNumber - 1) curveArray.push({points: [props.addShape.leftCorners[index + 1], props.addShape.controls.first[index + 1], props.addShape.controls.second[index + 1], props.addShape.rightCorners[index + 1]]})
          
          // down curve
          let downCurvePre = new THREE.CatmullRomCurve3(down);
          down[0] = downCurvePre.getPoint(0.1);
          downCurvePre = new THREE.CatmullRomCurve3(down);
          let point3 = downCurvePre.getPoints(50);
          let downCurve_add = new THREE.CatmullRomCurve3(down_add);
          let point4 = downCurve_add.getPoints(50);
          let point5 = point3.concat(point4);
          let downCurve = new THREE.CatmullRomCurve3(point5);
  
          // down positions
          let downPoints = downCurve.getSpacedPoints(100);
          down = [];
  
          // first down point
          if (20 > t) firstPosition = 100;
          else if ((20 <= t) && (40 > t)) firstPosition = Math.floor(100 - (t - 20) * 100 / 20);
          else if ((40 <= t) && (80 > t)) firstPosition = 0;
          else if ((80 <= t) && (90 > t)) firstPosition = Math.floor((t - 80) * 100 / 10);
          else if (90 <= t) firstPosition = 100;
          down.push(downPoints[firstPosition]);
  
          // second down point
          if (20 > t) secondPosition = 100;
          else if ((20 <= t) && (40 > t)) secondPosition = Math.floor(100 - (t - 20) * 80 / 20);
          else if ((40 <= t) && (80 > t)) secondPosition = 20;
          else if ((80 <= t) && (90 > t)) secondPosition = Math.floor(20 + (t - 80) * 80 / 10);
          else if (90 <= t) secondPosition = 100;
          down.push(downPoints[secondPosition]);
  
          // third down point
          if (20 > t) thirdPosition = 100;
          else if ((20 <= t) && (40 > t)) thirdPosition = Math.floor(100 - (t - 20) * 60 / 20);
          else if ((40 <= t) && (80 > t)) thirdPosition = 40;
          else if ((80 <= t) && (90 > t)) thirdPosition = Math.floor(40 + (t - 80) * 60 / 10);
          else if (90 <= t) thirdPosition = 100;
          down.push(downPoints[thirdPosition]);
  
          // last down point
          if (20 > t) lastPosition = 100;
          else if ((20 <= t) && (40 > t)) lastPosition = Math.floor(100 - (t - 20) * 40 / 20);
          else if ((40 <= t) && (80 > t)) lastPosition = 60;
          else if ((80 <= t) && (90 > t)) lastPosition = Math.floor(60 + (t - 80) * 40 / 10);
          else if (t <= 90) lastPosition = 100;
          down.push(downPoints[lastPosition]);
          
          
          // down.push(props.addShape.rightCorners[index + 1]);
          lane.points = down;
          n_laneArray.push(lane);
  
          // left elemnt for lane
          lane = {};
          let left = [];
          left.push(up[0]);
          left.push(down[0]);
          lane.points = left;
          n_laneArray.push(lane);
  
  
          // right element for lane
          lane = {};
          let right = [];
          right.push(up[3]);
          right.push(down[3]);
          lane.points = right;
          n_laneArray.push(lane);
  
          // conclusion
          lane = {};
          m_laneArray.push(n_laneArray);
        }
        setLaneArray(m_laneArray);
      }
    } 
  }, [props.addShape, time, props.swimEndPreview, props.orientation, props.isAnimation])

  useEffect(() => {
    if (!props.swimEndPreview) {
      if ((props.orientation === 'ltr') && !props.isAnimation) {
        let t = time;
        let m_laneArray = [];
        let m_laneArray_num = [];
        let curveArray = [];
        for (let index = 0; index < props.laneNumber; index++) {
          let n_laneArray = [];
          let n_laneArray_num = [];
          let lane = {};
          let lane_num = {};
          let up = [];
          let up_num = [];
          let up_add = [];
          
          // up position
          up.push(props.addShape.leftCorners[index]);
          up.push(props.addShape.controls.first[index]);
          up.push(props.addShape.controls.second[index]);
          up.push(props.addShape.rightCorners[index]);
  
          up_add.push(new THREE.Vector3(props.addShape.leftCorners[index].x, props.addShape.leftCorners[index].y, props.addShape.leftCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.leftCorners[index].x - 3, props.addShape.leftCorners[index].y, props.addShape.leftCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.leftCorners[index].x - 6, props.addShape.leftCorners[index].y, props.addShape.leftCorners[index].z));
  
          // up_num position
          up_num.push(props.addShape.leftCorners[index]);
          up_num.push(props.addShape.controls.first[index]);
          up_num.push(props.addShape.controls.second[index]);
          up_num.push(props.addShape.rightCorners[index]);
  
          // array for curve
          curveArray.push({points: [props.addShape.leftCorners[index], props.addShape.controls.first[index] , props.addShape.controls.second[index], props.addShape.rightCorners[index]]})
          let upCurvePre = new THREE.CatmullRomCurve3(up);
          let upCurvePrePoints = upCurvePre.getSpacedPoints(100);
          up[3] = upCurvePrePoints[70];
          upCurvePre = new THREE.CatmullRomCurve3(up);
          let point1 = upCurvePre.getPoints(50);
          
          let up_addCurve = new THREE.CatmullRomCurve3(up_add);
          let point2 = up_addCurve.getPoints(50);
          point2.reverse();
          
          let point = point2.concat(point1);
          let upCurve = new THREE.CatmullRomCurve3(point);
    
          // 
          let upCurve_num = new THREE.CatmullRomCurve3(up_num);
          let up_numPoints = upCurve_num.getSpacedPoints(100);
          let upPoints = upCurve.getSpacedPoints(100);
  
          //
          up_num[0] = up_numPoints[60];
          up_num[1] = up_numPoints[63];
          up_num[2] = up_numPoints[66];
          up_num[3] = up_numPoints[70];
          upCurve_num = new THREE.CatmullRomCurve3(up_num);
  
          let upPoints_num = upCurve_num.getSpacedPoints(100);
        
          up_num = [];
  
          // first position
          up = [];
          let firstPosition;
          if (index * 10 >= t) firstPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) firstPosition = Math.floor((t - 10 * index) * 10);
          else if (((index + 1) * 10) <= t ) firstPosition = 100;
          up.push(upPoints[firstPosition]);
  
          // second position
          let secondPosition;
          if (index * 10 >= t) secondPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) secondPosition = Math.floor((t - 10 * index) * 8);
          else if (((index + 1) * 10) <= t ) secondPosition = 80;
          up.push(upPoints[secondPosition]);
  
          // third position
          let thirdPosition;
          if (index * 10 >= t) thirdPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) thirdPosition = Math.floor((t - 10 * index) * 6);
          else if (((index + 1) * 10) <= t ) thirdPosition = 60;
          up.push(upPoints[thirdPosition]);
  
          // last position
          let lastPosition;
          if (index * 10 >= t) lastPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) lastPosition = Math.floor((t - 10 * index) * 4);
          else if (((index + 1) * 10) <= t ) lastPosition = 40;
          up.push(upPoints[lastPosition]);
  
          // up.push(props.addShape.rightCorners[index]);
          lane.points = up;
          n_laneArray.push(lane);
          lane = {};
  
          //
          let firstPosition_num; 
          if ((index + 1) * 10 >= t) firstPosition_num = 100;
          else if ((((index + 1) * 10) < t) && ((((index + 1) + 1) * 10 ) > t)) firstPosition_num = Math.floor(100 - (t - 10 * ((index + 1))) * 10);
          else if ((((index + 1) + 1) * 10) <= t ) firstPosition_num = 0;
          up_num.push(upPoints_num[firstPosition_num]);
  
          // 
          let secondPosition_num
          if (firstPosition_num === 100) secondPosition_num = 100;
          else secondPosition_num = Math.floor(100 - (100 - firstPosition_num) * 2 / 3);
          up_num.push(upPoints_num[secondPosition_num]);
  
          //
          let thirdPosition_num;
          if (firstPosition_num === 100) thirdPosition_num = 100;
          else thirdPosition_num = Math.floor(100 - (100 - firstPosition_num) * 1 / 3);
          up_num.push(upPoints_num[thirdPosition_num]);
  
          //
          let lastPosition_num = upPoints_num[100];
          up_num.push(lastPosition_num);
  
          lane_num.points = up_num;
          n_laneArray_num.push(lane_num);
          lane_num = {};
  
          let down = [];
          let down_num = [];
          let down_add = [];
  
          // down position
          down.push(props.addShape.leftCorners[index + 1]);
          down.push(props.addShape.controls.first[index + 1]);
          down.push(props.addShape.controls.second[index + 1]);
          down.push(props.addShape.rightCorners[index + 1]);
  
          down_add.push(props.addShape.leftCorners[index + 1])
          down_add.push(new THREE.Vector3(props.addShape.leftCorners[index + 1].x - 3, props.addShape.leftCorners[index + 1].y, props.addShape.leftCorners[index + 1].z))
          down_add.push(new THREE.Vector3(props.addShape.leftCorners[index + 1].x - 6, props.addShape.leftCorners[index + 1].y, props.addShape.leftCorners[index + 1].z))
  
          //
          down_num.push(props.addShape.leftCorners[index + 1]);
          down_num.push(props.addShape.controls.first[index + 1]);
          down_num.push(props.addShape.controls.second[index + 1]);
          down_num.push(props.addShape.rightCorners[index + 1]);
  
          // last position
          if (index === props.laneNumber - 1) curveArray.push({points: [props.addShape.leftCorners[index + 1], props.addShape.controls.first[index + 1], props.addShape.controls.second[index + 1], props.addShape.rightCorners[index + 1]]})
          
          // down curve
          let downCurvePre = new THREE.CatmullRomCurve3(down);
          let downCurvePrePoints = downCurvePre.getSpacedPoints(100);
          down[3] = downCurvePrePoints[70];
          downCurvePre = new THREE.CatmullRomCurve3(down);
          let point3 = downCurvePre.getPoints(50);
          let downCurve_add = new THREE.CatmullRomCurve3(down_add);
          let point4 = downCurve_add.getPoints(50);
          point4.reverse();
          let point5 = point4.concat(point3);
          let downCurve = new THREE.CatmullRomCurve3(point5);
          
          // 
          let downCurve_num = new THREE.CatmullRomCurve3(down_num);
          let down_numPoints = downCurve_num.getSpacedPoints(100);
          // let downLeftPoint = downCurve.getPoint(0.1);
          // down[0] = downLeftPoint
  
          // down positions
          let downPoints = downCurve.getSpacedPoints(100);
          down = [];
  
          //
          down_num[0] = down_numPoints[60];
          down_num[1] = down_numPoints[63];
          down_num[2] = down_numPoints[66];
          down_num[3] = down_numPoints[70];
          downCurve_num = new THREE.CatmullRomCurve3(down_num);
          
          let downPoints_num = downCurve_num.getSpacedPoints(100);
          down_num = [];
  
          // first down point
          if (index * 10 >= t) firstPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) firstPosition = Math.floor((t - 10 * index) * 10);
          else if (((index + 1) * 10) <= t ) firstPosition = 100;
          down.push(downPoints[firstPosition]);
  
          // second down point
          if (index * 10 >= t) secondPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) secondPosition = Math.floor((t - 10 * index) * 8);
          else if (((index + 1) * 10) <= t ) secondPosition = 80;
          down.push(downPoints[secondPosition]);
  
          // third down point
          if (index * 10 >= t) thirdPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) thirdPosition = Math.floor((t - 10 * index) * 6);
          else if (((index + 1) * 10) <= t ) thirdPosition = 60;
          down.push(downPoints[thirdPosition]);
  
          // last down point
          if (index * 10 >= t) lastPosition = 0;
          else if (((index * 10) < t) && (((index + 1) * 10 )> t)) lastPosition = Math.floor((t - 10 * index) * 4);
          else if (((index + 1) * 10) <= t ) lastPosition = 40;
          down.push(downPoints[lastPosition]);
          
          lane.points = down;
          n_laneArray.push(lane);
  
          //
          if ((index + 1) * 10 >= t) firstPosition_num = 100;
          else if ((((index + 1) * 10) < t) && ((((index + 1) + 1) * 10 )> t)) firstPosition_num = Math.floor(100 - (t - 10 * (index + 1)) * 10);
          else if ((((index + 1) + 1) * 10) <= t ) firstPosition_num = 0;
          down_num.push(downPoints_num[firstPosition_num]);
          
          //
          if (firstPosition_num === 100) secondPosition_num = 100;
          else secondPosition_num = Math.floor(100 - (100 - firstPosition_num)  * 2 / 3);
          down_num.push(downPoints_num[secondPosition_num]);
  
          // 
          if (firstPosition_num === 100) thirdPosition_num = 100;
          else thirdPosition_num = Math.floor(100 - (100 - firstPosition_num) / 3);
          down_num.push(downPoints_num[thirdPosition_num]);
  
          //
          lastPosition_num = downPoints_num[100];
          down_num.push(lastPosition_num);
          
  
          lane_num.points = down_num;
          n_laneArray_num.push(lane_num);
          lane_num = {};
  
          // left elemnt for lane
          lane = {};
          let left = [];
          left.push(up[0]);
          left.push(down[0]);
          lane.points = left;
          n_laneArray.push(lane);
  
          //
          lane_num = {};
          let left_num = [];
          left_num.push(up_num[0]);
          left_num.push(down_num[0]);
          lane_num.points = left_num;
          n_laneArray_num.push(lane_num);
  
  
          // right element for lane
          lane = {};
          let right = [];
          right.push(up[3]);
          right.push(down[3]);
          lane.points = right;
          n_laneArray.push(lane);
  
          //
          lane_num = {};
          let right_num = [];
          right_num.push(up_num[3]);
          right_num.push(down_num[3]);
          lane_num.points = right_num;
          n_laneArray_num.push(lane_num);
  
          // conclusion
          lane = {};
          lane_num = {};
          m_laneArray.push(n_laneArray);
          m_laneArray_num.push(n_laneArray_num);
        }
        setLaneArray(m_laneArray);
        setLaneArrayNum(m_laneArray_num);
      } else if ((props.orientation === 'ltr') && props.isAnimation) {
        let t = time;
        let m_laneArray = [];
        let curveArray = [];
        for (let index = 0; index < props.laneNumber; index++) {
          let n_laneArray = [];
          let lane = {};
          let up = [];
          let up_add = [];
          
          // up position
          up.push(props.addShape.leftCorners[index]);
          up.push(props.addShape.controls.first[index]);
          up.push(props.addShape.controls.second[index]);
          up.push(props.addShape.rightCorners[index]);
  
          up_add.push(new THREE.Vector3(props.addShape.leftCorners[index].x, props.addShape.leftCorners[index].y, props.addShape.leftCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.leftCorners[index].x - 3, props.addShape.leftCorners[index].y, props.addShape.leftCorners[index].z));
          up_add.push(new THREE.Vector3(props.addShape.leftCorners[index].x - 6, props.addShape.leftCorners[index].y, props.addShape.leftCorners[index].z));
  
          // array for curve
          curveArray.push({points: [props.addShape.leftCorners[index], props.addShape.controls.first[index] , props.addShape.controls.second[index], props.addShape.rightCorners[index]]})
          let upCurvePre = new THREE.CatmullRomCurve3(up);
          let upCurvePrePoints = upCurvePre.getSpacedPoints(100);
          up[3] = upCurvePrePoints[70];
          upCurvePre = new THREE.CatmullRomCurve3(up);
          let point1 = upCurvePre.getPoints(50);
          
          let up_addCurve = new THREE.CatmullRomCurve3(up_add);
          let point2 = up_addCurve.getPoints(50);
          point2.reverse();
          
          let point = point2.concat(point1);
          let upCurve = new THREE.CatmullRomCurve3(point);
          let upPoints = upCurve.getSpacedPoints(100);
  
          // first position
          up = [];

          let firstPosition;
          if (20 > t) firstPosition = 0;
          else if ((20 <= t) && (40 > t)) firstPosition = Math.floor((t - 20) * 100 / 20);
          else if ((40 <= t) && (80 > t)) firstPosition = 100;
          else if ((80 <= t) && (90 > t)) firstPosition = Math.floor(100 - (t - 80) * 100 / 10);
          else if (90 <= t) firstPosition = 0;
          up.push(upPoints[firstPosition]);
  
          // second position
          let secondPosition;
          if (20 > t) secondPosition = 0;
          else if ((20 <= t) && (40 > t)) secondPosition = Math.floor((t - 20) * 80 / 20);
          else if ((40 <= t) && (80 > t)) secondPosition = 80;
          else if ((80 <= t) && (90 > t)) secondPosition = Math.floor(80 - (t - 80) * 80 / 10);
          else if (90 <= t) secondPosition = 0;
          up.push(upPoints[secondPosition]);
  
          // third position
          let thirdPosition;
          if (20 > t) thirdPosition = 0;
          else if ((20 <= t) && (40 > t)) thirdPosition = Math.floor((t - 20) * 60 / 20);
          else if ((40 <= t) && (80 > t)) thirdPosition = 60;
          else if ((80 <= t) && (90 > t)) thirdPosition = Math.floor(60 - (t - 80) * 60 / 10);
          else if (90 <= t) thirdPosition = 0;
          up.push(upPoints[thirdPosition]);
  
          // last position
          let lastPosition;
          if (20 > t) lastPosition = 0;
          else if ((20 <= t) && (40 > t)) lastPosition = Math.floor((t - 20) * 40 / 20);
          else if ((40 <= t) && (80 > t)) lastPosition = 40;
          else if ((80 <= t) && (90 > t)) lastPosition = Math.floor(40 - (t - 80) * 40 / 10);
          else if (90 <= t) lastPosition = 0;
          up.push(upPoints[lastPosition]);
  
          // up.push(props.addShape.rightCorners[index]);
          lane.points = up;
          n_laneArray.push(lane);
          lane = {};
  
          let down = [];
          let down_add = [];
  
          // down position
          down.push(props.addShape.leftCorners[index + 1]);
          down.push(props.addShape.controls.first[index + 1]);
          down.push(props.addShape.controls.second[index + 1]);
          down.push(props.addShape.rightCorners[index + 1]);
  
          down_add.push(props.addShape.leftCorners[index + 1])
          down_add.push(new THREE.Vector3(props.addShape.leftCorners[index + 1].x - 3, props.addShape.leftCorners[index + 1].y, props.addShape.leftCorners[index + 1].z))
          down_add.push(new THREE.Vector3(props.addShape.leftCorners[index + 1].x - 6, props.addShape.leftCorners[index + 1].y, props.addShape.leftCorners[index + 1].z))
  
          // last position
          if (index === props.laneNumber - 1) curveArray.push({points: [props.addShape.leftCorners[index + 1], props.addShape.controls.first[index + 1], props.addShape.controls.second[index + 1], props.addShape.rightCorners[index + 1]]})
          
          // down curve
          let downCurvePre = new THREE.CatmullRomCurve3(down);
          let downCurvePrePoints = downCurvePre.getSpacedPoints(100);
          down[3] = downCurvePrePoints[70];
          downCurvePre = new THREE.CatmullRomCurve3(down);
          let point3 = downCurvePre.getPoints(50);
          let downCurve_add = new THREE.CatmullRomCurve3(down_add);
          let point4 = downCurve_add.getPoints(50);
          point4.reverse();
          let point5 = point4.concat(point3);
          let downCurve = new THREE.CatmullRomCurve3(point5);
  
          // down positions
          let downPoints = downCurve.getSpacedPoints(100);
          down = [];
  
          // first down point
          if (20 > t) firstPosition = 0;
          else if ((20 <= t) && (40 > t)) firstPosition = Math.floor((t - 20) * 100 / 20);
          else if ((40 <= t) && (80 > t)) firstPosition = 100;
          else if ((80 <= t) && (90 > t)) firstPosition = Math.floor(100 - (t - 80) * 100 / 10);
          else if (90 <= t) firstPosition = 0;
          down.push(downPoints[firstPosition]);
  
          // second down point
          if (20 > t) secondPosition = 0;
          else if ((20 <= t) && (40 > t)) secondPosition = Math.floor((t - 20) * 80 / 20);
          else if ((40 <= t) && (80 > t)) secondPosition = 80;
          else if ((80 <= t) && (90 > t)) secondPosition = Math.floor(80 - (t - 80) * 80 / 10);
          else if (90 <= t) secondPosition = 0;
          down.push(downPoints[secondPosition]);
  
          // third down point
          if (20 > t) thirdPosition = 0;
          else if ((20 <= t) && (40 > t)) thirdPosition = Math.floor((t - 20) * 60 / 20);
          else if ((40 <= t) && (80 > t)) thirdPosition = 60;
          else if ((80 <= t) && (90 > t)) thirdPosition = Math.floor(60 - (t - 80) * 60 / 10);
          else if (90 <= t) thirdPosition = 0;
          down.push(downPoints[thirdPosition]);
  
          // last down point
          if (20 > t) lastPosition = 0;
          else if ((20 <= t) && (40 > t)) lastPosition = Math.floor((t - 20) * 40 / 20);
          else if ((40 <= t) && (80 > t)) lastPosition = 40;
          else if ((80 <= t) && (90 > t)) lastPosition = Math.floor(40 - (t - 80) * 40 / 10);
          else if (90 <= t) lastPosition = 0;
          down.push(downPoints[lastPosition]);
          
          lane.points = down;
          n_laneArray.push(lane);
  
          // left elemnt for lane
          lane = {};
          let left = [];
          left.push(up[0]);
          left.push(down[0]);
          lane.points = left;
          n_laneArray.push(lane);
  
  
          // right element for lane
          lane = {};
          let right = [];
          right.push(up[3]);
          right.push(down[3]);
          lane.points = right;
          n_laneArray.push(lane);
  
          // conclusion
          lane = {};
          m_laneArray.push(n_laneArray);
        }
        setLaneArray(m_laneArray);
      }
    }  
  }, [props.addShape, time, props.swimEndPreview, props.orientation, props.isAnimation])

  useEffect(() => {
    setTime(props.time);
  }, [props.time])

  useEffect(() => {
    setTime(0);
  }, [props.orientation])

  useFrame((_, delta) => {
    if (props.isAnimation) {
      if (time < 100) setTime(time + 1.5);
      else setTime(0);
    }
  })

  return (
    <group ref={laneRef}>
      {
        laneArray?laneArray.map((lane, index) => {
          return (
            <group key={index}>
            {
              !props.isAnimation && laneArrayNum[index] &&
              <Degree lane={laneArrayNum[index]} index={index} time={time} state={props.state} swimEndPreview={props.swimEndPreview} visibility={props.orientation === 'rtl'?lane[2].points[1].x: lane[3].points[1].x} orientation={props.orientation} startingLane={props.startingLane} endingLane={props.endingLane} upOrDown={props.upOrDown}/>
            }
            <Lane lane={lane} index={index} time={time} state={props.state} swimEndPreview={props.swimEndPreview} visibility={props.orientation === 'rtl'?lane[3].points[1].x: lane[2].points[1].x} limitText={props.orientation === 'rtl'?limitText[index]: 0} orientation={props.orientation} isAnimation={props.isAnimation} startingLane={props.startingLane} endingLane={props.endingLane} upOrDown={props.upOrDown}/>
            </group>
          )
        }):
        <></>
      }
    </group>
  )
}

const mapStateToProps = value => {
    return { addShape: value.addShape };
};

const mapDispatchToProps = {
    getValue
};

export default connect(mapStateToProps, mapDispatchToProps)(Plane);