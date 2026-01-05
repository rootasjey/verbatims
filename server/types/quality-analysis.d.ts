/**
 * Type definitions for data quality analysis
 */

export type Severity = 'high' | 'medium' | 'low'

export interface QualityIssue {
  severity: Severity
  title: string
  description: string
  count: number
  percentage?: number
  details?: string[]
}

export interface QualityAnalysisResult {
  overallScore: number
  completeness: number
  accuracy: number
  consistency: number
  totalRecords: number
  issues: QualityIssue[]
  analysisDate: string
  recommendations: string[]
}

export interface QualityAnalysisResponse {
  success: boolean
  data: QualityAnalysisResult
}
