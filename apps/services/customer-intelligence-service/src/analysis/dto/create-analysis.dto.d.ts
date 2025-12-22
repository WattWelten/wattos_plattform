export declare enum CustomerType {
    KOMMUNE = "kommune",
    UNTERNEHMEN = "unternehmen",
    ORGANISATION = "organisation"
}
export declare enum AnalysisType {
    INITIAL = "initial",
    PERIODIC = "periodic",
    ON_DEMAND = "on-demand"
}
export declare class CreateAnalysisDto {
    customerType: CustomerType;
    analysisType?: AnalysisType;
    dataSources?: string[];
    metadata?: Record<string, any>;
}
//# sourceMappingURL=create-analysis.dto.d.ts.map