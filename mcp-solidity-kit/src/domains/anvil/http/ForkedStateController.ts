import {
  BaseController,
  RequestValidator,
  userIdHeaderKey,
  type ExpressRequest,
  type ExpressResponse,
} from "mcp-http";
import { createJsonUploadService } from "mcp-fs";
import {
  ForkedStateService,
  type ForkedStateUpload,
} from "./ForkedStateService.js";
import { UploadForkedStateSchema } from "./schemas.js";

export class ForkedStateController extends BaseController {
  private readonly forkedStateService: ForkedStateService;
  private readonly uploadService: ReturnType<typeof createJsonUploadService>;

  constructor() {
    super();
    this.forkedStateService = new ForkedStateService({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFilesPerProject: 100,
    });
    this.uploadService = createJsonUploadService({
      fieldName: "file",
      maxFileSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 1,
      allowedMimeTypes: ["application/json"],
      allowedExtensions: [".json"],
    });
  }

  /**
   * Upload forked state file
   * POST /api/v1/evm/forked-state
   */
  async uploadForkedState(
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<void> {
    try {
      // Get file from request using upload service
      const uploadResult = this.uploadService.getFileFromRequest(req);
      if (!uploadResult.success) {
        this.sendError(res, uploadResult.error!);
        return;
      }

      // Validate request body using Zod
      const bodyValidation = RequestValidator.validateBody(
        UploadForkedStateSchema,
        req,
      );
      if (!bodyValidation.success) {
        this.sendError(res, bodyValidation.errors!.join("; "));
        return;
      }

      const { projectId, subPath } = bodyValidation.data!;
      const file = uploadResult.file!;

      // Validate JSON content
      const fileContent = file.buffer.toString("utf8");
      const jsonValidation =
        this.uploadService.validateJsonContent(fileContent);
      if (!jsonValidation.isValid) {
        this.sendError(res, jsonValidation.error!);
        return;
      }

      // Create forked state
      const upload: ForkedStateUpload = {
        userId: req.headers["x-user-id"] as string,
        projectId,
        fileName: file.originalname,
        content: fileContent,
        subPath,
        metadata: {
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          uploadedAt: new Date().toISOString(),
        },
      };

      const forkedState =
        await this.forkedStateService.createForkedState(upload);

      this.sendSuccess(res, forkedState, undefined, 201);
    } catch (error) {
      this.sendInternalError(res, error);
    }
  }

  /**
   * Get forked state content
   * GET /api/v1/evm/forked-state/:projectId/:fileName
   */
  async getForkedState(
    req: ExpressRequest,
    res: ExpressResponse,
  ): Promise<void> {
    try {
      const { projectId, fileName } = req.params;
      const userId = req.headers[userIdHeaderKey] as string;
      const forkedState = await this.forkedStateService.getForkedStateContent(
        userId,
        projectId as string,
        fileName as string,
      );
      this.sendSuccess(res, forkedState, undefined, 200);
      return;
    } catch (error) {
      this.sendInternalError(res, error);
    }
  }

  /**
   * Get upload middleware for file uploads
   */
  getUploadMiddleware() {
    return this.uploadService.createUploadMiddleware();
  }
}
