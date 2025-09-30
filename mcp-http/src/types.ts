import { z } from "zod";

/**
 * This is a copy of the CallToolResultSchema from @modelcontextprotocol/sdk/types.js
 * Use this to avoid the dependency on @modelcontextprotocol/sdk/types.js 
 */
export declare const CallToolResultSchema: z.ZodObject<z.objectUtil.extendShape<{
  /**
   * This result property is reserved by the protocol to allow clients and servers to attach additional metadata to their responses.
   */
  _meta: z.ZodOptional<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>>;
}, {
  content: z.ZodArray<z.ZodUnion<[z.ZodObject<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, z.ZodTypeAny, "passthrough">>]>, "many">;
  isError: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
  /**
   * This result property is reserved by the protocol to allow clients and servers to attach additional metadata to their responses.
   */
  _meta: z.ZodOptional<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>>;
}, {
  content: z.ZodArray<z.ZodUnion<[z.ZodObject<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, z.ZodTypeAny, "passthrough">>]>, "many">;
  isError: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
  /**
   * This result property is reserved by the protocol to allow clients and servers to attach additional metadata to their responses.
   */
  _meta: z.ZodOptional<z.ZodObject<{}, "passthrough", z.ZodTypeAny, z.objectOutputType<{}, z.ZodTypeAny, "passthrough">, z.objectInputType<{}, z.ZodTypeAny, "passthrough">>>;
}, {
  content: z.ZodArray<z.ZodUnion<[z.ZodObject<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"text">;
      /**
       * The text content of the message.
       */
      text: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"image">;
      /**
       * The base64-encoded image data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the image. Different providers may support different image types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"audio">;
      /**
       * The base64-encoded audio data.
       */
      data: z.ZodString;
      /**
       * The MIME type of the audio. Different providers may support different audio types.
       */
      mimeType: z.ZodString;
  }, z.ZodTypeAny, "passthrough">>, z.ZodObject<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, "passthrough", z.ZodTypeAny, z.objectOutputType<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, z.ZodTypeAny, "passthrough">, z.objectInputType<{
      type: z.ZodLiteral<"resource">;
      resource: z.ZodUnion<[z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * The text of the item. This must only be set if the item can actually be represented as text (not binary data).
           */
          text: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>, z.ZodObject<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, "passthrough", z.ZodTypeAny, z.objectOutputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">, z.objectInputType<z.objectUtil.extendShape<{
          /**
           * The URI of this resource.
           */
          uri: z.ZodString;
          /**
           * The MIME type of this resource, if known.
           */
          mimeType: z.ZodOptional<z.ZodString>;
      }, {
          /**
           * A base64-encoded string representing the binary data of the item.
           */
          blob: z.ZodString;
      }>, z.ZodTypeAny, "passthrough">>]>;
  }, z.ZodTypeAny, "passthrough">>]>, "many">;
  isError: z.ZodOptional<z.ZodDefault<z.ZodBoolean>>;
}>, z.ZodTypeAny, "passthrough">>;

export type CallToolResult = z.infer<typeof CallToolResultSchema>;