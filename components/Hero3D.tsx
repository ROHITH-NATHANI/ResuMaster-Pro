import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial } from '@react-three/drei';

// Robust fallback for particle generation to avoid module resolution errors
const generateSpherePoints = (count: number, radius: number) => {
    const points = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.cbrt(Math.random()) * radius;
        const sinPhi = Math.sin(phi);
        points[i * 3] = r * sinPhi * Math.cos(theta);
        points[i * 3 + 1] = r * sinPhi * Math.sin(theta);
        points[i * 3 + 2] = r * Math.cos(phi);
    }
    return points;
};

const ParticleField = ({ isDark, ...props }: { isDark: boolean;[key: string]: any }) => {
    const ref = useRef<any>();
    const [sphere] = useMemo(() => {
        return [generateSpherePoints(6000, 1.8)];
    }, []);

    useFrame((state, delta) => {
        if (ref.current) {
            ref.current.rotation.x -= delta / 15;
            ref.current.rotation.y -= delta / 20;
        }
    });

    return (
        <group rotation={[0, 0, Math.PI / 4]}>
            <Points ref={ref} positions={sphere} stride={3} frustumCulled={false} {...props}>
                <PointMaterial
                    transparent
                    color={isDark ? "#818cf8" : "#4f46e5"}
                    size={isDark ? 0.008 : 0.006}
                    sizeAttenuation={true}
                    depthWrite={false}
                    opacity={isDark ? 0.6 : 0.8}
                />
            </Points>
        </group>
    );
};

const Hero3D = ({ isDark = true }: { isDark?: boolean }) => {
    return (
        <div className="fixed inset-0 z-0 h-full w-full pointer-events-none">
            <Canvas camera={{ position: [0, 0, 1] }}>
                <ParticleField isDark={isDark} />
            </Canvas>
        </div>
    );
};

export default Hero3D;
