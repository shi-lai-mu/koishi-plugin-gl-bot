import { HTTP } from 'koishi';

export class NapCatApi {
  get requestHeaders() {
    return {
      authorization: this.token,
    };
  }

  constructor(
    private http: HTTP,
    private baseUrl: string,
    private token: string,
  ) {}

  /**
   * 获取文件信息
   * @param fileId 文件ID
   * @returns 文件信息或false
   */
  async getFile(fileId: string) {
    console.log(`${this.baseUrl}/get_file`, {
      file_id: fileId,
    });
    try {
      const result = await this.http<{
        data: {
          file: string;
          url: string;
          file_size: string;
          file_name: string;
        };
      }>(`${this.baseUrl}/get_file`, {
        method: 'POST',
        headers: this.requestHeaders,
        data: {
          file_id: fileId,
        },
      });

      console.log(result?.data);

      if (result.status === 200 && result.data) {
        return result.data.data;
      }
    } catch (error) {
      console.error('Error fetching file:', error);
    }
    return false;
  }
}
