import React, { useState } from 'react';
import * as THREE from 'three'
import { useDrag } from "@use-gesture/react";
import { useEffect } from 'react';

const DrawPoint = ({ position, onUpdate, state, previewState, isVCPoint }) => {
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let planeIntersectPoint = new THREE.Vector3();

    const [pos, setPos] = useState(position)

    const bind = useDrag(({ active, movement: [x, y], timeStamp, event }) => {
        if (active) {
            event.ray.intersectPlane(floorPlane, planeIntersectPoint);
            setPos({
                x: planeIntersectPoint.x,
                y: planeIntersectPoint.y,
                z: planeIntersectPoint.z
            });
            onUpdate(planeIntersectPoint)
        }
        return timeStamp;
    });

    useEffect(() =>{
        setPos(position);
    }, [position])

    return (
        <>
            <mesh position={[pos.x, pos.y, pos.z]}  {...bind()} visible={previewState}>
                <circleBufferGeometry args={[0.08, 30]} />
                <meshStandardMaterial  visible = {state === "check" ? false : true} color={isVCPoint? '#880000': '#ffffff'}/>
            </mesh>
        </>
    )
}

export default DrawPoint

