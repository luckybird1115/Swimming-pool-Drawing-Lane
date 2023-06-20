import React, { useState } from 'react';
import * as THREE from 'three'
import { useDrag } from "@use-gesture/react";
import { useEffect } from 'react';

const MiddleShape = ({ position, onMoveLane, state, previewState }) => {

    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    let planeIntersectPoint = new THREE.Vector3();

    const [pos, setPos] = useState(position)
    const [drag, setDrag] = useState(false)

    const bind = useDrag(({ active, movement: [x, y], timeStamp, event }) => {
        if (active) {
            event.ray.intersectPlane(floorPlane, planeIntersectPoint);
            var prePos = { ...pos }
            var delta = prePos.y - planeIntersectPoint.y;
            onMoveLane(delta)
        }
        setDrag(active)
        return timeStamp;
    });

    useEffect(() => {
        if (!drag) setPos(position)
    }, [drag, position])

    return (
        <>
            <mesh position={[pos.x, pos.y, pos.z]}  {...bind()} visible={previewState}>
                <boxGeometry args={[0.2, 0.1, 0.05]} />
                <meshStandardMaterial visible={(!drag && state !== "check" )? true : false} />
            </mesh>
        </>
    )
}

export default MiddleShape

