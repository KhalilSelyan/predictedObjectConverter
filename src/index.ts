import { CubePrimitive, SceneUpdate, SpherePrimitive } from "@foxglove/schemas";
import { Time } from "@foxglove/schemas/schemas/typescript/Time";
import { ExtensionContext } from "@foxglove/studio";

export type PredictedObject = {
  header: {
    stamp: Time;
    frame_id: string;
  };
  objects: {
    object_id: {
      uuid: Uint8Array;
    };
    existence_probability: number;
    classification: {
      label: number;
      probability: number;
    }[];
    kinematics: {
      initial_pose_with_covariance: {
        pose: {
          position: {
            x: number;
            y: number;
            z: number;
          };
          orientation: {
            x: number;
            y: number;
            z: number;
            w: number;
          };
        };
        covariance: Float64Array;
      };
      initial_twist_with_covariance: {
        twist: {
          linear: {
            x: number;
            y: number;
            z: number;
          };
          angular: {
            x: number;
            y: number;
            z: number;
          };
        };
        covariance: Float64Array;
      };
      initial_acceleration_with_covariance: {
        accel: {
          linear: {
            x: number;
            y: number;
            z: number;
          };
          angular: {
            x: number;
            y: number;
            z: number;
          };
        };
        covariance: Float64Array;
      };
      predicted_paths: {
        path: {
          position: {
            x: number;
            y: number;
            z: number;
          };
          orientation: {
            x: number;
            y: number;
            z: number;
            w: number;
          };
        }[];
        time_step: {
          sec: number;
          nsec: number;
        };
        confidence: number;
      }[];
    };
    shape: {
      type: number;
      footprint: {
        points: {
          x: number;
          y: number;
        }[];
      };
      dimensions: {
        x: number;
        y: number;
        z: number;
      };
    };
  }[];
};
const colorMap = {
  0: { r: 1.0, g: 1.0, b: 1.0, a: 0.5 }, // UNKNOWN // white // hex: #FFFFFF
  1: { r: 1.0, g: 0.0, b: 0.0, a: 0.5 }, // CAR // red // hex: #FF0000
  2: { r: 1.0, g: 0.5, b: 0.5, a: 0.5 }, // BICYCLE // pink // hex: #FF8080
  3: { r: 0.0, g: 0.5, b: 1.0, a: 0.5 }, // BUS // blue // hex: #0080FF
  4: { r: 0.0, g: 0.5, b: 1.0, a: 0.5 }, // TRUCK // blue // hex: #0080FF
  5: { r: 1.0, g: 0.5, b: 0.5, a: 0.5 }, // CYCLIST // pink // hex: #FF8080
  6: { r: 1.0, g: 1.0, b: 0.5, a: 0.5 }, // MOTORCYCLE // yellow // hex: #FFFF80
  7: { r: 0.75, g: 1.0, b: 0.25, a: 0.5 }, // PEDESTRIAN // green // hex: #BFFF40
};

enum Classification {
  UNKNOWN = 0,
  CAR = 1,
  BICYCLE = 2,
  BUS = 3,
  TRUCK = 4,
  CYCLIST = 5,
  MOTORCYCLE = 6,
  PEDESTRIAN = 7,
}

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_auto_perception_msgs/msg/PredictedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: (msg: PredictedObject): SceneUpdate => {
      const { header, objects } = msg;

      // create same thing but with spheres
      const spherePrimitives: SpherePrimitive[] = objects.reduce(
        (acc: SpherePrimitive[], object) => {
          const { kinematics, classification } = object;
          const { initial_pose_with_covariance, predicted_paths } = kinematics;

          if (
            classification.length === 0 ||
            !classification[0] ||
            classification[0].label === undefined
          ) {
            return acc;
          }

          const { label } = classification[0];
          const color = colorMap[label as keyof typeof colorMap] ?? colorMap[0];

          // if the object is not unknown and has a predicted path, draw the path
          if (
            label !== Classification.UNKNOWN &&
            Math.floor(initial_pose_with_covariance.pose.position.x) > 0
          ) {
            const spherePath: SpherePrimitive[] = predicted_paths[0]!.path.map((pose) => {
              const sphere: SpherePrimitive = {
                color,
                size: { x: 0.25, y: 0.25, z: 0.25 },
                pose,
              };
              return sphere;
            });
            acc.push(...spherePath);
          }
          return acc;
        },
        [],
      );

      const cubePrimitives: CubePrimitive[] = objects.reduce((acc: CubePrimitive[], object) => {
        const { kinematics, shape, classification } = object;
        const { initial_pose_with_covariance } = kinematics;
        const { position, orientation } = initial_pose_with_covariance.pose;
        const { dimensions } = shape;
        const { x, y } = dimensions;

        if (
          classification.length === 0 ||
          !classification[0] ||
          classification[0].label === undefined
        ) {
          return acc;
        }

        const { label } = classification[0];
        const color = colorMap[label as keyof typeof colorMap] ?? colorMap[0];

        const predictedObjectCube: CubePrimitive = {
          color,
          size: { x, y, z: 0.1 },
          pose: {
            position: {
              x: position.x,
              y: position.y,
              // make the cube start at the ground level (z = 0)
              z: position.z - 0.5 * dimensions.z,
            },
            orientation,
          },
        };

        acc.push(predictedObjectCube);
        return acc;
      }, []);

      /*   // create a text primitive for the predicted objects cube according to their position and label/color
      const cubeTexts: TextPrimitive[] = objects.reduce((acc: TextPrimitive[], object) => {
        const { kinematics, classification } = object;
        const { initial_pose_with_covariance } = kinematics;

        if (
          classification.length === 0 ||
          !classification[0] ||
          classification[0].label === undefined
        ) {
          return acc;
        }

        const { label } = classification[0];
        const color = colorMap[label as keyof typeof colorMap] ?? colorMap[0];

        const text: TextPrimitive = {
          color,
          text: Classification[label as keyof typeof colorMap]!,
          billboard: true,
          pose: initial_pose_with_covariance.pose,
          font_size: 24,
          scale_invariant: true,
        };

        acc.push(text);
        return acc;
      }, []); */

      const sceneUpdateMessage = {
        deletions: [],
        entities: [
          {
            id: "predicted_objects",
            timestamp: header.stamp,
            frame_id: header.frame_id,
            frame_locked: false,
            lifetime: { sec: 1, nsec: 0 },
            metadata: [],
            arrows: [],
            cylinders: [],
            lines: [],
            spheres: spherePrimitives,
            texts: [],
            triangles: [],
            models: [],
            cubes: cubePrimitives,
          },
        ],
      };
      return sceneUpdateMessage;
    },
  });
}
