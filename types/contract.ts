export interface FieldItem {
    value: string | string[] | null;
    found: boolean;
    confidence: number;
    source_text: string | null;
    page: number | null;
}

export interface ContractFields {
    parties: FieldItem;
    effective_date: FieldItem;
    term: FieldItem;
    end_date: FieldItem;
    renewal: FieldItem;
    notice_period: FieldItem;
    payment_terms: FieldItem;
    liability_cap: FieldItem;
    governing_law: FieldItem;
    termination_rights: FieldItem;
}

export interface RiskFlag {
    title: string;
    severity: "High" | "Medium" | "Low";
    reason: string;
    source_text: string;
    clause_ref?: string | null;
}

export interface ContractAnalysisResult {
    code: string;
    document_name: string;
    contract_tpe: "NDA" | "MSA" | "Vendor Agreement" | string;
    fields: ContractFields;
    risks: RiskFlag[];
    summary: string;
}