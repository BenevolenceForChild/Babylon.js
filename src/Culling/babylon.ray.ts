module BABYLON {
    /**
     * Class representing a ray with position and direction
     */
    export class Ray {
        private static readonly TmpVector3 = Tools.BuildArray(6, Vector3.Zero);
        private _tmpRay: Ray;

        /**
         * Creates a new ray
         * @param origin origin point
         * @param direction direction
         * @param length length of the ray
         */
        constructor(
            /** origin point */
            public origin: Vector3,
            /** direction */
            public direction: Vector3,
            /** length of the ray */
            public length: number = Number.MAX_VALUE) {
        }

        // Methods
        /**
         * Checks if the ray intersects a box
         * @param minimum bound of the box
         * @param maximum bound of the box
         * @param intersectionTreshold extra extend to be added to the box in all direction
         * @returns if the box was hit
         */
        public intersectsBoxMinMax(minimum: DeepImmutable<Vector3>, maximum: DeepImmutable<Vector3>, intersectionTreshold: number = 0): boolean {
            const newMinimum = Ray.TmpVector3[0].copyFromFloats(minimum.x - intersectionTreshold, minimum.y - intersectionTreshold, minimum.z - intersectionTreshold);
            const newMaximum = Ray.TmpVector3[1].copyFromFloats(maximum.x + intersectionTreshold, maximum.y + intersectionTreshold, maximum.z + intersectionTreshold);
            var d = 0.0;
            var maxValue = Number.MAX_VALUE;
            var inv: number;
            var min: number;
            var max: number;
            var temp: number;
            if (Math.abs(this.direction.x) < 0.0000001) {
                if (this.origin.x < newMinimum.x || this.origin.x > newMaximum.x) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.x;
                min = (newMinimum.x - this.origin.x) * inv;
                max = (newMaximum.x - this.origin.x) * inv;
                if (max === -Infinity) {
                    max = Infinity;
                }

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }

            if (Math.abs(this.direction.y) < 0.0000001) {
                if (this.origin.y < newMinimum.y || this.origin.y > newMaximum.y) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.y;
                min = (newMinimum.y - this.origin.y) * inv;
                max = (newMaximum.y - this.origin.y) * inv;

                if (max === -Infinity) {
                    max = Infinity;
                }

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }

            if (Math.abs(this.direction.z) < 0.0000001) {
                if (this.origin.z < newMinimum.z || this.origin.z > newMaximum.z) {
                    return false;
                }
            }
            else {
                inv = 1.0 / this.direction.z;
                min = (newMinimum.z - this.origin.z) * inv;
                max = (newMaximum.z - this.origin.z) * inv;

                if (max === -Infinity) {
                    max = Infinity;
                }

                if (min > max) {
                    temp = min;
                    min = max;
                    max = temp;
                }

                d = Math.max(min, d);
                maxValue = Math.min(max, maxValue);

                if (d > maxValue) {
                    return false;
                }
            }
            return true;
        }

        /**
         * Checks if the ray intersects a box
         * @param box the bounding box to check
         * @param intersectionTreshold extra extend to be added to the BoundingBox in all direction
         * @returns if the box was hit
         */
        public intersectsBox(box: DeepImmutable<BoundingBox>, intersectionTreshold: number = 0): boolean {
            return this.intersectsBoxMinMax(box.minimum, box.maximum, intersectionTreshold);
        }

        /**
         * If the ray hits a sphere
         * @param sphere the bounding sphere to check
         * @param intersectionTreshold extra extend to be added to the BoundingSphere in all direction
         * @returns true if it hits the sphere
         */
        public intersectsSphere(sphere: DeepImmutable<BoundingSphere>, intersectionTreshold: number = 0): boolean {
            var x = sphere.center.x - this.origin.x;
            var y = sphere.center.y - this.origin.y;
            var z = sphere.center.z - this.origin.z;
            var pyth = (x * x) + (y * y) + (z * z);
            const radius = sphere.radius + intersectionTreshold;
            var rr = radius * radius;

            if (pyth <= rr) {
                return true;
            }

            var dot = (x * this.direction.x) + (y * this.direction.y) + (z * this.direction.z);
            if (dot < 0.0) {
                return false;
            }

            var temp = pyth - (dot * dot);

            return temp <= rr;
        }

        /**
         * If the ray hits a triange
         * @param vertex0 triangle vertex
         * @param vertex1 triangle vertex
         * @param vertex2 triangle vertex
         * @returns intersection information if hit
         */
        public intersectsTriangle(vertex0: DeepImmutable<Vector3>, vertex1: DeepImmutable<Vector3>, vertex2: DeepImmutable<Vector3>): Nullable<IntersectionInfo> {
            const edge1 = Ray.TmpVector3[0];
            const edge2 = Ray.TmpVector3[1];
            const pvec = Ray.TmpVector3[2];
            const tvec = Ray.TmpVector3[3];
            const qvec =  Ray.TmpVector3[4];

            vertex1.subtractToRef(vertex0, edge1);
            vertex2.subtractToRef(vertex0, edge2);
            Vector3.CrossToRef(this.direction, edge2, pvec);
            var det = Vector3.Dot(edge1, pvec);

            if (det === 0) {
                return null;
            }

            var invdet = 1 / det;

            this.origin.subtractToRef(vertex0, tvec);

            var bu = Vector3.Dot(tvec, pvec) * invdet;

            if (bu < 0 || bu > 1.0) {
                return null;
            }

            Vector3.CrossToRef(tvec, edge1, qvec);

            var bv = Vector3.Dot(this.direction, qvec) * invdet;

            if (bv < 0 || bu + bv > 1.0) {
                return null;
            }

            //check if the distance is longer than the predefined length.
            var distance = Vector3.Dot(edge2, qvec) * invdet;
            if (distance > this.length) {
                return null;
            }

            return new IntersectionInfo(bu, bv, distance);
        }

        /**
         * Checks if ray intersects a plane
         * @param plane the plane to check
         * @returns the distance away it was hit
         */
        public intersectsPlane(plane: DeepImmutable<Plane>): Nullable<number> {
            var distance: number;
            var result1 = Vector3.Dot(plane.normal, this.direction);
            if (Math.abs(result1) < 9.99999997475243E-07) {
                return null;
            }
            else {
                var result2 = Vector3.Dot(plane.normal, this.origin);
                distance = (-plane.d - result2) / result1;
                if (distance < 0.0) {
                    if (distance < -9.99999997475243E-07) {
                        return null;
                    } else {
                        return 0;
                    }
                }

                return distance;
            }
        }

        /**
         * Checks if ray intersects a mesh
         * @param mesh the mesh to check
         * @param fastCheck if only the bounding box should checked
         * @returns picking info of the intersecton
         */
        public intersectsMesh(mesh: DeepImmutable<AbstractMesh>, fastCheck?: boolean): PickingInfo {

            var tm = Tmp.Matrix[0];

            mesh.getWorldMatrix().invertToRef(tm);

            if (this._tmpRay) {
                Ray.TransformToRef(this, tm, this._tmpRay);
            }else {
                this._tmpRay = Ray.Transform(this, tm);
            }

            return mesh.intersects(this._tmpRay, fastCheck);

        }

        /**
         * Checks if ray intersects a mesh
         * @param meshes the meshes to check
         * @param fastCheck if only the bounding box should checked
         * @param results array to store result in
         * @returns Array of picking infos
         */
        public intersectsMeshes(meshes: Array<DeepImmutable<AbstractMesh>>, fastCheck?: boolean, results?: Array<PickingInfo>): Array<PickingInfo> {

            if (results) {
                results.length = 0;
            }else {
                results = [];
            }

            for (var i = 0; i < meshes.length; i++) {
                var pickInfo = this.intersectsMesh(meshes[i], fastCheck);

                if (pickInfo.hit) {
                    results.push(pickInfo);
                }
            }

            results.sort(this._comparePickingInfo);

            return results;

        }

        private _comparePickingInfo(pickingInfoA: DeepImmutable<PickingInfo>, pickingInfoB: DeepImmutable<PickingInfo>): number {

            if (pickingInfoA.distance < pickingInfoB.distance) {
                return -1;
            }else if (pickingInfoA.distance > pickingInfoB.distance) {
                return 1;
            }else {
                return 0;
            }

        }

        private static smallnum = 0.00000001;
        private static rayl = 10e8;

        /**
         * Intersection test between the ray and a given segment whithin a given tolerance (threshold)
         * @param sega the first point of the segment to test the intersection against
         * @param segb the second point of the segment to test the intersection against
         * @param threshold the tolerance margin, if the ray doesn't intersect the segment but is close to the given threshold, the intersection is successful
         * @return the distance from the ray origin to the intersection point if there's intersection, or -1 if there's no intersection
         */
        intersectionSegment(sega: DeepImmutable<Vector3>, segb: DeepImmutable<Vector3>, threshold: number): number {
            const o = this.origin;
            const u =  Tmp.Vector3[0];
            const rsegb  = Tmp.Vector3[1];
            const v =  Tmp.Vector3[2];
            const w =  Tmp.Vector3[3];

            segb.subtractToRef(sega, u);

            this.direction.scaleToRef(Ray.rayl, v);
            o.addToRef(v, rsegb);

            sega.subtractToRef(o, w);

            var a = Vector3.Dot(u, u);                  // always >= 0
            var b = Vector3.Dot(u, v);
            var c = Vector3.Dot(v, v);                  // always >= 0
            var d = Vector3.Dot(u, w);
            var e = Vector3.Dot(v, w);
            var D = a * c - b * b;                      // always >= 0
            var sc: number, sN: number, sD = D;         // sc = sN / sD, default sD = D >= 0
            var tc: number, tN: number, tD = D;         // tc = tN / tD, default tD = D >= 0

            // compute the line parameters of the two closest points
            if (D < Ray.smallnum) {                     // the lines are almost parallel
                sN = 0.0;                               // force using point P0 on segment S1
                sD = 1.0;                               // to prevent possible division by 0.0 later
                tN = e;
                tD = c;
            }
            else {                                      // get the closest points on the infinite lines
                sN = (b * e - c * d);
                tN = (a * e - b * d);
                if (sN < 0.0) {                         // sc < 0 => the s=0 edge is visible
                    sN = 0.0;
                    tN = e;
                    tD = c;
                } else if (sN > sD) {                   // sc > 1 => the s=1 edge is visible
                    sN = sD;
                    tN = e + b;
                    tD = c;
                }
            }

            if (tN < 0.0) {                             // tc < 0 => the t=0 edge is visible
                tN = 0.0;
                // recompute sc for this edge
                if (-d < 0.0) {
                    sN = 0.0;
                } else if (-d > a) {
                    sN = sD;
                       }
                else {
                    sN = -d;
                    sD = a;
                }
            } else if (tN > tD) {                       // tc > 1 => the t=1 edge is visible
                tN = tD;
                // recompute sc for this edge
                if ((-d + b) < 0.0) {
                    sN = 0;
                } else if ((-d + b) > a) {
                    sN = sD;
                } else {
                    sN = (-d + b);
                    sD = a;
                }
            }
            // finally do the division to get sc and tc
            sc = (Math.abs(sN) < Ray.smallnum ? 0.0 : sN / sD);
            tc = (Math.abs(tN) < Ray.smallnum ? 0.0 : tN / tD);

            // get the difference of the two closest points
            const qtc = Tmp.Vector3[4];
            v.scaleToRef(tc, qtc);
            const qsc = Tmp.Vector3[5];
            u.scaleToRef(sc, qsc);
            qsc.addInPlace(w);
            const dP = Tmp.Vector3[6];
            qsc.subtractToRef(qtc, dP); // = S1(sc) - S2(tc)

            var isIntersected = (tc > 0) && (tc <= this.length) && (dP.lengthSquared() < (threshold * threshold));   // return intersection result

            if (isIntersected) {
                return qsc.length();
            }
            return -1;
        }

        /**
         * Update the ray from viewport position
         * @param x position
         * @param y y position
         * @param viewportWidth viewport width
         * @param viewportHeight viewport height
         * @param world world matrix
         * @param view view matrix
         * @param projection projection matrix
         * @returns this ray updated
         */
        public update(x: number, y: number, viewportWidth: number, viewportHeight: number, world: DeepImmutable<Matrix>, view: DeepImmutable<Matrix>, projection: DeepImmutable<Matrix>): Ray {
            Vector3.UnprojectRayToRef(x, y, viewportWidth, viewportHeight, world, view, projection, this);
            return this;
        }

        // Statics
        /**
         * Creates a ray with origin and direction of 0,0,0
         * @returns the new ray
         */
        public static Zero(): Ray {
            return new Ray(Vector3.Zero(), Vector3.Zero());
        }

        /**
         * Creates a new ray from screen space and viewport
         * @param x position
         * @param y y position
         * @param viewportWidth viewport width
         * @param viewportHeight viewport height
         * @param world world matrix
         * @param view view matrix
         * @param projection projection matrix
         * @returns new ray
         */
        public static CreateNew(x: number, y: number, viewportWidth: number, viewportHeight: number, world: DeepImmutable<Matrix>, view: DeepImmutable<Matrix>, projection: DeepImmutable<Matrix>): Ray {
            let result = Ray.Zero();

            return result.update(x, y, viewportWidth, viewportHeight, world, view, projection);
        }

        /**
        * Function will create a new transformed ray starting from origin and ending at the end point. Ray's length will be set, and ray will be
        * transformed to the given world matrix.
        * @param origin The origin point
        * @param end The end point
        * @param world a matrix to transform the ray to. Default is the identity matrix.
        * @returns the new ray
        */
        public static CreateNewFromTo(origin: DeepImmutable<Vector3>, end: DeepImmutable<Vector3>, world: DeepImmutable<Matrix> = Matrix.IdentityReadOnly): Ray {
            var direction = end.subtract(origin);
            var length = Math.sqrt((direction.x * direction.x) + (direction.y * direction.y) + (direction.z * direction.z));
            direction.normalize();

            return Ray.Transform(new Ray(origin, direction, length), world);
        }

        /**
         * Transforms a ray by a matrix
         * @param ray ray to transform
         * @param matrix matrix to apply
         * @returns the resulting new ray
         */
        public static Transform(ray: DeepImmutable<Ray>, matrix: DeepImmutable<Matrix>): Ray {
            var result = new Ray(new Vector3(0, 0, 0), new Vector3(0, 0, 0));
            Ray.TransformToRef(ray, matrix, result);

            return result;
        }

        /**
         * Transforms a ray by a matrix
         * @param ray ray to transform
         * @param matrix matrix to apply
         * @param result ray to store result in
         */
        public static TransformToRef(ray: DeepImmutable<Ray>, matrix: DeepImmutable<Matrix>, result: Ray): void {
            Vector3.TransformCoordinatesToRef(ray.origin, matrix, result.origin);
            Vector3.TransformNormalToRef(ray.direction, matrix, result.direction);
            result.length = ray.length;

            var dir = result.direction;
            var len = dir.length();

            if (!(len === 0 || len === 1)) {
                var num = 1.0 / len;
                dir.x *= num;
                dir.y *= num;
                dir.z *= num;
                result.length *= len;
            }
        }
    }
}