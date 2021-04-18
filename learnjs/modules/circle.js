export const name = "Step8"
export { Circle }

const FULL_DEGREE = 360
const SEMI_DEGREE = 180
const QUARTER_DEGREE = 90
const DEGREE_ZERO_IN_RADIAN = 0
const DEGREE_FULL_IN_RADIAN = 360 * Math.PI / 180

class Circle {
    constructor(ctx, width, height, spacingRatio) {
        this._ctx = ctx
        this._width = width
        this._height = height
        this._spacingRatio = spacingRatio || 1.4
    }


    static computeDistanceXY(elem1, elem2) {
        return {
            x: Math.abs(elem2.x - elem1.x),
            y: Math.abs(elem2.y - elem1.y)
        }
    }

    static getTangentLine(x, y) {
        return  Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2))
    }

    static degToRad(deg) {
        return deg * Math.PI / 180
    }    

    static getRotateAngleInRad(x, y) {
        return Math.atan(x/y)
    }

    static getAngle(n) {
        return FULL_DEGREE / n
    }

    static getNearestMultipleToSemi(angle) {

        let quadrant = Math.floor(SEMI_DEGREE / angle)
        let deg = (quadrant * angle)
        return deg
    }

    getCalculatedAngle(angle) {
        let angleCalc = angle
        let direction = {
            x: 1,
            y: 1
        }
        if (angleCalc > 360) {
            angleCalc = angleCalc % 360
        }
        if (angleCalc > 270 && angleCalc <= 360) {
            angleCalc = angleCalc - 270
            direction.x = -1
            direction.y = -1
        } else if (angleCalc > 180 && angleCalc <= 270) {
            angleCalc = 270 - angleCalc 
            direction.x = -1
        } else if (angleCalc > 90 && angleCalc <= 180) {
            angleCalc = angleCalc - 90            
        } else if (angleCalc > 0 && angleCalc <= 90) {
            angleCalc = 90 - angleCalc
            direction.y = -1
        } else {
            angleCalc = 0
        }

        return {
            angle: angleCalc,
            dx: direction.x,
            dy: direction.y
        }
    }        
   
    getTranslateInfo(w, h) {
        let tx = 0
        let ty = 0
        let dimension = w - h
        let distance = Math.abs(dimension)/2
        let size = w

        if (dimension > 0) {
            tx = distance
            size = h
        } else {
            ty = distance
        }

        return {
            tx: tx,
            ty: ty,
            size: size,
            cx: size / 2,
            cy: size / 2
        }
    }

    getRadiusAndCenterPoint(dimension, angleToAddInDeg) {
        let spacingRatio = this._spacingRatio

        // dimension = radius + FirstPointDistanceToCenterPointY (p1) + SecondPointDistanceToCenterPointY (p2) + radius
        let p1AngleInDeg = (SEMI_DEGREE - angleToAddInDeg) / 2
        if (p1AngleInDeg < 0) {
            p1AngleInDeg = Math.abs(p1AngleInDeg)
        }
        let p1AngleInRad = Circle.degToRad(p1AngleInDeg)

        let angleNearestToSemi = Circle.getNearestMultipleToSemi(angleToAddInDeg)
        let angleCalc = this.getCalculatedAngle(angleNearestToSemi)
        let p2AngleInDeg = angleCalc.angle
        let p2AngleInRad = Circle.degToRad(p2AngleInDeg)

        // FirstPointDistanceToCenterPointY : 2 * radius / cos(p1)
        // SecondPointDistanceToCenterPointY : 2 * radius / cos(p1) * sin(p2)
        let m1 = 0
        if (p1AngleInDeg != QUARTER_DEGREE) {
            m1 = spacingRatio / Math.cos(p1AngleInRad)
        }
        let m2 = m1 * Math.sin(p2AngleInRad)
        let radius = dimension / (2 + m1 + m2)
        let cynew = radius + (m1 * radius) 
                
        return {
            radius: radius,
            cy: cynew
        }
    }    

    rotateCanvasOnCenterPoint(ctx, tElem, angleToRotateInRad) {
        ctx.beginPath()
        ctx.translate(tElem.cx, tElem.cy)
        ctx.rotate(angleToRotateInRad)
        ctx.translate(-tElem.cx, -tElem.cy)
        ctx.closePath()
    }

    addPoint(basePt, baseX, baseY, rotatedAngle, projectDirection) {
        let projectedAngle = rotatedAngle + (basePt.a * projectDirection)
        let pt = {
            x: baseX + (basePt.t * Math.cos(projectedAngle)), 
            y: baseY + (basePt.t * Math.sin(projectedAngle)), 
        }
        return pt
    }

    insertArrow(ctx, tElem, radius, angle, arrowPosition) {        
        if (angle === FULL_DEGREE) return 

        const ratio = {
            size: 0.8,
            middle: 0.5,
            edge: 0.8
        }
        let baseX = tElem.cx + (arrowPosition * radius/2)
        let baseY = radius
        
        let angleCalc = this.getCalculatedAngle(angle)
        let angleInDeg = angleCalc.angle

        let angleInRad = Circle.degToRad(angleInDeg)
        let tangent = tElem.cy - radius
        
        let a = {
            x: Math.cos(angleInRad),
            y: Math.sin(angleInRad)
        }

        let p1 = {
            x: tElem.cx,
            y: radius
        }

        let p2 = {
            x: tElem.cx + (tangent * a.x * angleCalc.dx),
            y: tElem.cy + (tangent * a.y * angleCalc.dy) 
        }

        let distanceXY = Circle.computeDistanceXY(p1, p2)
        let diameter = 2 * radius

        let rotatedAngle = Circle.getRotateAngleInRad(distanceXY.y, distanceXY.x)
        let distance = Circle.getTangentLine(distanceXY.x, distanceXY.y) 

        let arrowWidth = (distance - diameter) * ratio.middle
        let arrowHeight = arrowWidth

        let projectedPoints = [
            {
                x: (distance * ratio.middle) - (arrowWidth * ratio.middle),
                y: (arrowHeight * ratio.middle),
            },
            {
                x: (distance * ratio.middle),
                y: (arrowHeight * ratio.middle),
            },
            {
                x: (distance * ratio.middle),
                y: (arrowHeight * ratio.edge),
            },
            {
                x: (distance * ratio.middle) + (arrowWidth * ratio.middle),
                y: 0,
            }
        ]

        projectedPoints.forEach(function(pt){
            pt.t = Circle.getTangentLine(pt.x, pt.y)
            pt.a = Circle.getRotateAngleInRad(pt.y, pt.x)
        })

        let pts = []
        let ptsConfig = [
            { ptNum: 0, ptDir: -1 },
            { ptNum: 1, ptDir: -1 },
            { ptNum: 2, ptDir: -1 },
            { ptNum: 3, ptDir: -1 },
            { ptNum: 2, ptDir: 1 },
            { ptNum: 1, ptDir: 1 },
            { ptNum: 0, ptDir: 1 },
        ]

        let  c = this
        ptsConfig.forEach(function(cfg){
            pts.push(c.addPoint(projectedPoints[cfg.ptNum], baseX, baseY, rotatedAngle, cfg.ptDir))
        })

        ctx.beginPath()
        const pt0 = pts.shift()
        ctx.moveTo(pt0.x, pt0.y)        
        pts.forEach(pt => ctx.lineTo(pt.x, pt.y))
        ctx.fill()
        ctx.closePath()
    }
    
    insertCircle(ctx, tElem, radius) {

        ctx.beginPath()
        ctx.arc(tElem.cx, radius, radius, DEGREE_ZERO_IN_RADIAN, DEGREE_FULL_IN_RADIAN, false)            
        ctx.fill()  
        ctx.closePath()   

    }

    draw(elemHolders) {  
        let noOfElements = elemHolders.length
        let ctx = this._ctx
        let width = this._width
        let height = this._height
        
        let arrowPosition = 0 // 0: Middle ; 1: Upper 
        if (noOfElements === 2) {
            arrowPosition = 1
        }

        let angleToAddInDeg = Circle.getAngle(noOfElements)
        let angleToAddInRad = Circle.degToRad(angleToAddInDeg)
        let tElem = this.getTranslateInfo(width, height)
        let result = this.getRadiusAndCenterPoint(tElem.size, angleToAddInDeg)
        let radius = result.radius
            tElem.cy = result.cy

        ctx.clearRect(0, 0, width, height)
        ctx.translate(tElem.tx, tElem.ty)
        for (let i = 0; i < noOfElements; i++) {

            ctx.strokeStyle = elemHolders[i].color
            ctx.fillStyle = elemHolders[i].color            
            
            if (i > 0) {
                this.rotateCanvasOnCenterPoint(ctx, tElem, angleToAddInRad)
            }

            this.insertCircle(ctx, tElem, radius)

            this.insertArrow(ctx, tElem, radius, angleToAddInDeg, arrowPosition)

        }
        this.rotateCanvasOnCenterPoint(ctx, tElem, angleToAddInRad)    
        ctx.translate(-tElem.tx, -tElem.ty)
    }     
}