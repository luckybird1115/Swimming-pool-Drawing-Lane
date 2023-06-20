export const getValue = () => {
    return { type: "GET_VALUE" };
};

export const addPoints = (value) => {
    return { type: "ADD_POINTS", value: value};
};

export const addCPoints = (value) => {
    return { type: "ADD_CPOINTS", value: value}
}

export const addVCPoints = (value) => {
    return { type: "ADD_VCPOINTS", value: value}
}

export const addControls = (value) => {
    return { type: "ADD_CONTROLS", value: value};
};

export const addLeftCorners = (value) => {
    return { type: "ADD_LEFTCORNERS", value: value};
};

export const addRightCorners = (value) => {
    return { type: "ADD_RIGHTCORNERS", value: value};
};

export const addCurves = (value) => {
    return { type: "ADD_CURVES", value: value}
}