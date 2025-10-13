/**
 * Local Placeholder Image Service
 * Provides fallback images without relying on external services
 */

export interface PlaceholderOptions {
  width?: number
  height?: number
  text?: string
  backgroundColor?: string
  textColor?: string
  format?: 'svg' | 'png' | 'jpeg'
}

export class PlaceholderService {
  private static instance: PlaceholderService

  static getInstance(): PlaceholderService {
    if (!PlaceholderService.instance) {
      PlaceholderService.instance = new PlaceholderService()
    }
    return PlaceholderService.instance
  }

  /**
   * Generate a placeholder image URL
   */
  generatePlaceholderUrl(options: PlaceholderOptions = {}): string {
    const {
      width = 400,
      height = 600,
      text = 'No Image Available',
      backgroundColor = 'f3f4f6',
      textColor = '9ca3af',
      format = 'svg'
    } = options

    if (format === 'svg') {
      return this.generateSVGPlaceholder(width, height, text, backgroundColor, textColor)
    }

    // For PNG/JPEG, return the static placeholder
    return `/images/placeholder.svg`
  }

  /**
   * Generate SVG placeholder data URL
   */
  private generateSVGPlaceholder(
    width: number,
    height: number,
    text: string,
    backgroundColor: string,
    textColor: string
  ): string {
    const svg = `
      <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="${width}" height="${height}" fill="#${backgroundColor}"/>
        <rect x="20" y="20" width="${width - 40}" height="${height - 40}" fill="none" stroke="#d1d5db" stroke-width="2" stroke-dasharray="10,5"/>
        <circle cx="${width / 2}" cy="${height / 2 - 50}" r="30" fill="none" stroke="#d1d5db" stroke-width="2"/>
        <path d="M${width / 2 - 30} ${height / 2 - 80}h60M${width / 2 - 30} ${height / 2 - 20}h60" stroke="#d1d5db" stroke-width="2"/>
        <text x="${width / 2}" y="${height / 2 + 30}" text-anchor="middle" fill="#${textColor}" font-family="Arial, sans-serif" font-size="16">${text}</text>
      </svg>
    `.trim()

    return `data:image/svg+xml;base64,${btoa(svg)}`
  }

  /**
   * Get a default placeholder for products
   */
  getProductPlaceholder(): string {
    return this.generatePlaceholderUrl({
      width: 400,
      height: 600,
      text: 'Product Image',
      backgroundColor: 'f3f4f6',
      textColor: '9ca3af'
    })
  }

  /**
   * Get a placeholder for user avatars
   */
  getAvatarPlaceholder(): string {
    return this.generatePlaceholderUrl({
      width: 150,
      height: 150,
      text: 'Avatar',
      backgroundColor: 'e5e7eb',
      textColor: '6b7280'
    })
  }

  /**
   * Get a loading placeholder
   */
  getLoadingPlaceholder(): string {
    return this.generatePlaceholderUrl({
      width: 400,
      height: 600,
      text: 'Loading...',
      backgroundColor: 'f9fafb',
      textColor: 'd1d5db'
    })
  }

  /**
   * Check if an image URL is a placeholder
   */
  isPlaceholderImage(url: string): boolean {
    return url.includes('placeholder') ||
           url.includes('data:image/svg') ||
           url.startsWith('data:image')
  }

  /**
   * Get fallback image for broken images
   */
  getFallbackImage(): string {
    return '/images/placeholder.svg'
  }
}

// Export singleton instance
export const placeholderService = PlaceholderService.getInstance()