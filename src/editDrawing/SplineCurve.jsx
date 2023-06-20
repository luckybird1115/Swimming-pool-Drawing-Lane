import React, { useState, memo, useEffect, useRef } from 'react';

import * as THREE from 'three'
import { Line2 } from "three/examples/jsm/lines/Line2"
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial"
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry"
import { extend } from '@react-three/fiber'

extend({ LineMaterial, LineGeometry, Line2 })

const Spline = ({ curve_points, previewState }) => {

    const lRef = useRef();
    const lineGeom = new LineGeometry();
    const lineMat = new LineMaterial({
        color: 0xffffff,
        linewidth: 1,
    })
    lineMat.resolution.set(window.innerWidth, window.innerHeight)

    const makeLine = (linegeo, lineMat) => {
        lRef.current.remove(lRef.current.children[0])
        let line = new Line2(linegeo, lineMat);
        line.computeLineDistances();
        lRef.current.add(line);
    }

    useEffect(() => {
        let curve = new THREE.CatmullRomCurve3(curve_points);
        let resultPoints = curve.getSpacedPoints(100);
        let positions = [];
        for (let i = 0; i < resultPoints.length; i++) {
            positions.push(resultPoints[i].x);
            positions.push(resultPoints[i].y);
            positions.push(resultPoints[i].z);
        }
        lineGeom.setPositions(positions)

        makeLine(lineGeom, lineMat);

    }, [curve_points])


    useEffect(() => {

    }, [])
    return (
        <>
            <group
                ref={lRef}
                visible={previewState}
            >
            </group>
        </>
    )
}

export default Spline