import { ExtensionContext } from "@foxglove/studio";
import { CubePrimitive, SceneUpdate } from "@foxglove/schemas";
import { Time } from "@foxglove/schemas/schemas/typescript/Time";

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
  0: { r: 0.5, g: 0.5, b: 0.5, a: 0.5 }, // UNKNOWN
  1: { r: 0.0, g: 0.0, b: 1.0, a: 0.5 }, // CAR
  2: { r: 1.0, g: 0.0, b: 0.0, a: 0.5 }, // PEDESTRIAN
  3: { r: 0.0, g: 1.0, b: 0.0, a: 0.5 }, // CYCLIST
  4: { r: 0.0, g: 1.0, b: 1.0, a: 0.5 }, // TRUCK
  5: { r: 1.0, g: 0.0, b: 1.0, a: 0.5 }, // BUS
  6: { r: 1.0, g: 1.0, b: 0.0, a: 0.5 }, // MOTORCYCLE
  7: { r: 1.0, g: 1.0, b: 1.0, a: 0.5 }, // BICYCLE
};

export function activate(extensionContext: ExtensionContext): void {
  extensionContext.registerMessageConverter({
    fromSchemaName: "autoware_auto_perception_msgs/msg/PredictedObjects",
    toSchemaName: "foxglove.SceneUpdate",
    converter: (msg: PredictedObject): SceneUpdate => {
      const { header, objects } = msg;

      const cubePrimitives: (CubePrimitive | undefined)[] = objects.map((object) => {
        const { kinematics, shape, classification } = object;
        const { initial_pose_with_covariance } = kinematics;
        const { position, orientation } = initial_pose_with_covariance.pose;
        const { dimensions } = shape;
        const { x, y } = dimensions;
        if (classification.length === 0) {
          return undefined;
        }
        if (classification[0] && classification[0].label !== undefined) {
          const { label } = classification[0];
          const color = colorMap[label as keyof typeof colorMap] ?? colorMap[0];
          const cube: CubePrimitive = {
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
          return cube;
        } else {
          return undefined;
        }
      });

      const cubePrimitivesFiltered = cubePrimitives.filter(
        (cube) => cube !== undefined,
      ) as CubePrimitive[];
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
            spheres: [],
            texts: [],
            triangles: [],
            models: [],
            cubes: cubePrimitivesFiltered,
          },
        ],
      };
      return sceneUpdateMessage;
    },
  });
}
