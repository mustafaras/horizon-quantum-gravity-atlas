import {
  AddEquation, AdditiveBlending, AmbientLight as CurrentAmbientLight, ArrowHelper, BoxGeometry,
  BufferAttribute, BufferGeometry, CanvasTexture, CircleGeometry, Color,
  ColorManagement, ConeGeometry, CustomBlending, CylinderGeometry,
  DirectionalLight as CurrentDirectionalLight, DoubleSide, FogExp2, GridHelper,
  Group, IcosahedronGeometry, Line, LineBasicMaterial, LineDashedMaterial,
  LineSegments, LinearSRGBColorSpace, MathUtils, Mesh, MeshBasicMaterial,
  MeshStandardMaterial, OctahedronGeometry, OneFactor, PerspectiveCamera, PlaneGeometry,
  Points, PointsMaterial, QuadraticBezierCurve3, Raycaster, REVISION, Scene,
  ShaderMaterial, SphereGeometry, Sprite, SpriteMaterial, SrcAlphaFactor, TorusGeometry,
  TorusKnotGeometry, UnsignedByteType, Vector2, Vector3, WebGLRenderTarget,
  WebGLRenderer as CurrentWebGLRenderer,
} from "three";
import { EffectComposer as CurrentEffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";
import { UnrealBloomPass as CurrentUnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { GammaCorrectionShader } from "three/addons/shaders/GammaCorrectionShader.js";

// Keep the r147 display conventions until an explicitly approved pipeline change.
ColorManagement.enabled = false;

class WebGLRenderer extends CurrentWebGLRenderer {
  constructor(options) {
    super(options);
    this.outputColorSpace = LinearSRGBColorSpace;
    // r147 additive alpha used SRC_ALPHA, ONE, not the current ONE, ONE.
    const setMaterial = this.state.setMaterial;
    this.state.setMaterial = (material, frontFaceCW) => setMaterial(
      material.blending === AdditiveBlending && !material.premultipliedAlpha
        ? { ...material, blending: CustomBlending, blendEquation: AddEquation,
          blendSrc: SrcAlphaFactor, blendDst: OneFactor, blendEquationAlpha: AddEquation,
          blendSrcAlpha: SrcAlphaFactor, blendDstAlpha: OneFactor }
        : material,
      frontFaceCW,
    );
  }
}

class AmbientLight extends CurrentAmbientLight {
  constructor(color, intensity = 1) {
    super(color, intensity * Math.PI);
  }
}

class DirectionalLight extends CurrentDirectionalLight {
  constructor(color, intensity = 1) {
    super(color, intensity * Math.PI);
  }
}

class UnrealBloomPass extends CurrentUnrealBloomPass {
  constructor(...args) {
    super(...args);
    this.blendMaterial.premultipliedAlpha = false;
    this.materialHighPassFilter.fragmentShader = this.materialHighPassFilter.fragmentShader.replace(
      "luminance( texel.xyz )", "dot( texel.xyz, vec3( 0.299, 0.587, 0.114 ) )",
    );
    for (const target of [this.renderTargetBright, ...this.renderTargetsHorizontal, ...this.renderTargetsVertical]) {
      target.texture.type = UnsignedByteType;
    }
  }

  _getSeparableBlurMaterial(kernelRadius) {
    const material = super._getSeparableBlurMaterial(kernelRadius);
    const radius = kernelRadius / 2;
    const coefficients = Array.from({ length: radius }, (_, i) => Math.exp(-0.5 * i * i / (radius * radius)));
    const total = coefficients[0] + 2 * coefficients.slice(1).reduce((a, b) => a + b, 0);
    const offsets = [], weights = [];
    for (let i = 1; i < radius; i += 2) {
      const a = coefficients[i], b = coefficients[i + 1] ?? 0;
      offsets.push((i * a + (i + 1) * b) / (a + b));
      weights.push((a + b) / total);
    }
    material.defines.KERNEL_PAIRS = offsets.length;
    material.uniforms.centerWeight.value = coefficients[0] / total;
    material.uniforms.gaussianOffsets.value = offsets;
    material.uniforms.gaussianWeights.value = weights;
    return material;
  }

  _getCompositeMaterial(nMips) {
    const material = super._getCompositeMaterial(nMips);
    // Preserve the old alpha-based composition instead of r186's RGB-derived alpha.
    material.fragmentShader = `
      varying vec2 vUv;
      uniform sampler2D blurTexture1, blurTexture2, blurTexture3, blurTexture4, blurTexture5;
      uniform float bloomStrength, bloomRadius;
      uniform float bloomFactors[NUM_MIPS];
      uniform vec3 bloomTintColors[NUM_MIPS];
      float lerpBloomFactor(const in float factor) {
        return mix(factor, 1.2 - factor, bloomRadius);
      }
      void main() {
        gl_FragColor = bloomStrength * (
          lerpBloomFactor(bloomFactors[0]) * vec4(bloomTintColors[0], 1.0) * texture2D(blurTexture1, vUv) +
          lerpBloomFactor(bloomFactors[1]) * vec4(bloomTintColors[1], 1.0) * texture2D(blurTexture2, vUv) +
          lerpBloomFactor(bloomFactors[2]) * vec4(bloomTintColors[2], 1.0) * texture2D(blurTexture3, vUv) +
          lerpBloomFactor(bloomFactors[3]) * vec4(bloomTintColors[3], 1.0) * texture2D(blurTexture4, vUv) +
          lerpBloomFactor(bloomFactors[4]) * vec4(bloomTintColors[4], 1.0) * texture2D(blurTexture5, vUv)
        );
      }
    `;
    return material;
  }
}

class EffectComposer extends CurrentEffectComposer {
  constructor(renderer) {
    const size = renderer.getSize(new Vector2());
    const dpr = renderer.getPixelRatio();
    super(renderer, new WebGLRenderTarget(size.x * dpr, size.y * dpr, { type: UnsignedByteType }));
    this.setSize(size.x, size.y);
  }

  dispose() {
    for (const pass of this.passes) pass.dispose();
    super.dispose();
  }
}

export const threeCompatibility = Object.freeze({
  AdditiveBlending, AmbientLight, ArrowHelper, BoxGeometry, BufferAttribute,
  BufferGeometry, CanvasTexture, CircleGeometry, Color, ConeGeometry,
  CylinderGeometry, DirectionalLight, DoubleSide, EffectComposer, FogExp2,
  GammaCorrectionShader, GridHelper, Group, IcosahedronGeometry, Line,
  LineBasicMaterial, LineDashedMaterial, LineSegments, MathUtils, Mesh,
  MeshBasicMaterial, MeshStandardMaterial, OctahedronGeometry, PerspectiveCamera,
  PlaneGeometry, Points, PointsMaterial, QuadraticBezierCurve3, Raycaster,
  RenderPass, REVISION, Scene, ShaderMaterial, ShaderPass, SphereGeometry,
  Sprite, SpriteMaterial, TorusGeometry, TorusKnotGeometry, UnrealBloomPass,
  Vector2, Vector3, WebGLRenderer,
});
