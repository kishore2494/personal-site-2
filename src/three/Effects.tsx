import { EffectComposer, Bloom, Vignette } from "@react-three/postprocessing";

/** Postprocessing stack — the bloom is what makes the constellation glow. */
export default function Effects({ strong = true }: { strong?: boolean }) {
  return (
    <EffectComposer multisampling={0} enableNormalPass={false}>
      <Bloom
        intensity={strong ? 0.9 : 0.55}
        luminanceThreshold={0.4}
        luminanceSmoothing={0.85}
        mipmapBlur
        radius={0.65}
      />
      <Vignette eskil={false} offset={0.25} darkness={0.95} />
    </EffectComposer>
  );
}
