import type { PredictedObject } from ".";

export const PredictedObjectComponent = (props: { predictedObjects: PredictedObject[] }) => {
  const { predictedObjects } = props;
  return (
    <div className="h-full flex flex-col overflow-scroll">
      {/* {messages.map((message: MessageEvent<PredictedObject>, index: Key | null | undefined) => {
        return (
          <div key={index} className="flex flex-col items-center justify-center">
            <span className="text-sm text-gray-500">{message.receiveTime?.nsec}</span>
            <span className="text-sm text-gray-500">{message.receiveTime?.sec}</span>
            <span className="text-sm text-gray-500">{message.topic}</span> */}

      <div className="h-full flex flex-col items-center justify-center">
        {predictedObjects.map((object, index) => {
          return (
            <div key={index} className="flex flex-col items-center justify-center">
              <span className="text-sm text-gray-500">nsec: {object.header.stamp.nsec}</span>
              <span className="text-sm text-gray-500">sec: {object.header.stamp.sec}</span>
              <span className="text-sm text-gray-500">frame_id: {object.header.frame_id}</span>
              {object.objects.map((object, index) => {
                return (
                  <div key={index} className="flex flex-col items-center justify-center">
                    <span className="text-sm text-gray-500">
                      {/* display the uuid as a string after decoding the uint8array */}
                      ObjectID{" "}
                      {object.object_id.uuid.reduce((acc, curr) => acc + curr.toString(16), "")}
                    </span>

                    <span className="text-sm text-gray-500">{object.existence_probability}</span>
                    {object.classification.map((object, index) => {
                      return (
                        <div key={index} className="flex flex-col items-center justify-center">
                          <span className="text-sm text-gray-500">Label: {object.label}</span>
                          <span className="text-sm text-gray-500">
                            Probability: {object.probability}
                          </span>
                        </div>
                      );
                    })}
                    <span className="text-sm text-gray-500">
                      x: {object.kinematics.initial_pose_with_covariance.pose.position.x}
                    </span>
                    <span className="text-sm text-gray-500">
                      y: {object.kinematics.initial_pose_with_covariance.pose.position.y}
                    </span>
                    <span className="text-sm text-gray-500">
                      z: {object.kinematics.initial_pose_with_covariance.pose.position.z}
                    </span>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
    //   })}
    // </div>
    // );
  );
};
