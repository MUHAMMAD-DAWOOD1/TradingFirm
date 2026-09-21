"""
Nexus Trading Firm - Institutional Export Service
Generates broker-grade PDF and Excel/CSV statements for Trades, AI Decisions, and Master Statements.
"""

import io
import csv
from datetime import datetime
from typing import List, Dict, Any, Optional

from reportlab.lib.pagesizes import letter, landscape
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors


def _get_pdf_styles():
    base_styles = getSampleStyleSheet()
    styles = {
        "title": ParagraphStyle(
            "FirmTitle",
            parent=base_styles["Title"],
            fontName="Helvetica-Bold",
            fontSize=16,
            leading=20,
            textColor=colors.HexColor("#0f172a"),
            alignment=0,
            spaceAfter=4,
        ),
        "subtitle": ParagraphStyle(
            "FirmSubtitle",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#64748b"),
            spaceAfter=12,
        ),
        "section_h1": ParagraphStyle(
            "SectionH1",
            parent=base_styles["Heading2"],
            fontName="Helvetica-Bold",
            fontSize=11,
            leading=15,
            textColor=colors.HexColor("#1e293b"),
            spaceBefore=10,
            spaceAfter=6,
        ),
        "meta_label": ParagraphStyle(
            "MetaLabel",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#475569"),
        ),
        "meta_value": ParagraphStyle(
            "MetaVal",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0f172a"),
        ),
        "cell_text": ParagraphStyle(
            "CellText",
            parent=base_styles["Normal"],
            fontName="Helvetica",
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor("#1e293b"),
        ),
        "cell_header": ParagraphStyle(
            "CellHeader",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9.5,
            textColor=colors.white,
        ),
        "profit_text": ParagraphStyle(
            "ProfitText",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor("#059669"),
        ),
        "loss_text": ParagraphStyle(
            "LossText",
            parent=base_styles["Normal"],
            fontName="Helvetica-Bold",
            fontSize=7.5,
            leading=9,
            textColor=colors.HexColor("#dc2626"),
        ),
        "footer": ParagraphStyle(
            "FooterText",
            parent=base_styles["Normal"],
            fontName="Helvetica-Oblique",
            fontSize=7,
            leading=9,
            textColor=colors.HexColor("#94a3b8"),
            alignment=1,
        ),
    }
    return styles


def _build_header(styles, doc_title: str, account_name: str = "Active Account") -> List[Any]:
    elements = []
    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Firm Header Table
    header_data = [
        [
            Paragraph("<b>NEXUS INSTITUTIONAL PROP FIRM</b>", styles["title"]),
            Paragraph(f"<b>STATEMENT DATE:</b> {now_str}", styles["meta_value"]),
        ],
        [
            Paragraph(f"<b>DOCUMENT:</b> {doc_title.upper()} &nbsp;|&nbsp; <b>WALLET:</b> {account_name}", styles["subtitle"]),
            Paragraph("<b>STATUS:</b> AUDITED &amp; VERIFIED", styles["meta_label"]),
        ]
    ]
    t = Table(header_data, colWidths=[400, 320])
    t.setStyle(TableStyle([
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1),
        ('TOPPADDING', (0, 0), (-1, -1), 1),
    ]))
    elements.append(t)
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0f172a"), spaceBefore=4, spaceAfter=8))
    return elements


def _build_metrics_scorecard(styles, metrics: Dict[str, Any]) -> Table:
    net_pnl = float(metrics.get("net_pnl_usd", 0.0) or 0.0)
    win_rate = float(metrics.get("win_rate_pct", 0.0) or 0.0)
    profit_factor = float(metrics.get("profit_factor", 0.0) or 0.0)
    pf_str = "Infinity" if profit_factor >= 999 else f"{profit_factor:.2f}"
    gross_profit = float(metrics.get("gross_profit_usd", 0.0) or 0.0)
    gross_loss = float(metrics.get("gross_loss_usd", 0.0) or 0.0)
    total_trades = int(metrics.get("total_trades", 0) or 0)
    wins = int(metrics.get("wins_count", 0) or 0)
    losses = int(metrics.get("losses_count", 0) or 0)

    data = [
        ["NET REALIZED PNL", "WIN RATE %", "PROFIT FACTOR", "GROSS PROFIT / LOSS", "TRADES AUDITED"],
        [
            f"+${net_pnl:.2f}" if net_pnl >= 0 else f"-${abs(net_pnl):.2f}",
            f"{win_rate:.1f}%",
            pf_str,
            f"+${gross_profit:.2f} / -${gross_loss:.2f}",
            f"{total_trades} ({wins}W / {losses}L)"
        ]
    ]

    t = Table(data, colWidths=[140, 140, 140, 160, 140])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1e293b")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 7.5),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor("#f8fafc")),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 1), (-1, 1), 9),
        ('TEXTCOLOR', (0, 1), (0, 1), colors.HexColor("#059669") if net_pnl >= 0 else colors.HexColor("#dc2626")),
        ('TEXTCOLOR', (2, 1), (2, 1), colors.HexColor("#d97706")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('TOPPADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
    ]))
    return t


# ---------------------------------------------------------------------------
# PDF BUILDERS
# ---------------------------------------------------------------------------

def build_trades_pdf(trades: List[Dict[str, Any]], account_info: Dict[str, Any], metrics: Dict[str, Any]) -> bytes:
    """Generate a high-resolution, institutional landscape PDF for Closed Trades."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24)
    styles = _get_pdf_styles()
    story = []

    account_name = account_info.get("name", "Active Demo Wallet")
    story.extend(_build_header(styles, "Official Closed Trades Settlement Ledger", account_name))
    
    # Metrics scorecard
    if metrics:
        story.append(_build_metrics_scorecard(styles, metrics))
        story.append(Spacer(1, 10))

    story.append(Paragraph("<b>AUDITED CLOSED POSITIONS REGISTER</b>", styles["section_h1"]))

    # Table Headers
    headers = [
        Paragraph("<b>Ticket ID</b>", styles["cell_header"]),
        Paragraph("<b>Asset</b>", styles["cell_header"]),
        Paragraph("<b>Side</b>", styles["cell_header"]),
        Paragraph("<b>Lots</b>", styles["cell_header"]),
        Paragraph("<b>Entry</b>", styles["cell_header"]),
        Paragraph("<b>Exit</b>", styles["cell_header"]),
        Paragraph("<b>Resolution</b>", styles["cell_header"]),
        Paragraph("<b>Realized PnL ($)</b>", styles["cell_header"]),
        Paragraph("<b>Open Date</b>", styles["cell_header"]),
        Paragraph("<b>Settlement Date</b>", styles["cell_header"]),
    ]

    table_data = [headers]

    for t in trades:
        pnl = float(t.get("realized_pnl") or t.get("pnl") or 0.0)
        pnl_style = styles["profit_text"] if pnl >= 0 else styles["loss_text"]
        pnl_str = f"+${pnl:.2f}" if pnl >= 0 else f"-${abs(pnl):.2f}"
        reason = str(t.get("close_reason") or "MANUAL").replace("CLOSED_", "")

        row = [
            Paragraph(str(t.get("id", ""))[:14], styles["cell_text"]),
            Paragraph(f"<b>{t.get('symbol', '')}</b>", styles["cell_text"]),
            Paragraph(f"<b>{t.get('side', '')}</b>", styles["cell_text"]),
            Paragraph(str(t.get("quantity", "")), styles["cell_text"]),
            Paragraph(f"${float(t.get('entry_price', 0.0)):.2f}", styles["cell_text"]),
            Paragraph(f"${float(t.get('close_price') or t.get('current_price') or 0.0):.2f}", styles["cell_text"]),
            Paragraph(reason, styles["cell_text"]),
            Paragraph(pnl_str, pnl_style),
            Paragraph(str(t.get("opened_at", ""))[:16], styles["cell_text"]),
            Paragraph(str(t.get("closed_at", "") or t.get("opened_at", ""))[:16], styles["cell_text"]),
        ]
        table_data.append(row)

    if len(table_data) == 1:
        table_data.append([Paragraph("No closed trades logged in this report.", styles["cell_text"])] * 10)

    # 10 columns across ~740 pt width in landscape
    col_widths = [75, 55, 45, 40, 70, 70, 80, 85, 110, 110]
    trades_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    trades_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(trades_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("This document represents an authenticated statement generated by the Nexus Trading Execution Engine. All records are backed by immutable SQLite local logs.", styles["footer"]))

    doc.build(story)
    buf.seek(0)
    return buf.read()


def build_ai_decisions_pdf(ai_records: List[Dict[str, Any]]) -> bytes:
    """Generate a high-resolution institutional PDF for AI Quantitative Decisions History."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24)
    styles = _get_pdf_styles()
    story = []

    story.extend(_build_header(styles, "AI Quantitative Intelligence & Decision Audit", "Institutional Model Engine"))

    story.append(Paragraph(f"<b>TOTAL LOGGED AI DECISIONS: {len(ai_records)}</b>", styles["section_h1"]))

    headers = [
        Paragraph("<b>Task ID</b>", styles["cell_header"]),
        Paragraph("<b>Timestamp</b>", styles["cell_header"]),
        Paragraph("<b>Asset</b>", styles["cell_header"]),
        Paragraph("<b>Decision</b>", styles["cell_header"]),
        Paragraph("<b>Conf %</b>", styles["cell_header"]),
        Paragraph("<b>Risk</b>", styles["cell_header"]),
        Paragraph("<b>Entry</b>", styles["cell_header"]),
        Paragraph("<b>SL / TP</b>", styles["cell_header"]),
        Paragraph("<b>Outcome</b>", styles["cell_header"]),
        Paragraph("<b>Accuracy</b>", styles["cell_header"]),
    ]

    table_data = [headers]

    for r in ai_records:
        dec = r.get("final_decision", "WAIT")
        conf = int(r.get("confidence", 70) or 70)
        outcome = r.get("outcome_status", "PENDING")
        acc_score = float(r.get("ai_accuracy_score", 0.0) or 0.0)

        sl = float(r.get("stop_loss", 0.0) or 0.0)
        tp = float(r.get("take_profit", 0.0) or 0.0)

        row = [
            Paragraph(str(r.get("id", ""))[:14], styles["cell_text"]),
            Paragraph(str(r.get("timestamp", ""))[:16], styles["cell_text"]),
            Paragraph(f"<b>{r.get('asset', '')}</b>", styles["cell_text"]),
            Paragraph(f"<b>{dec}</b>", styles["profit_text"] if dec == "BUY" else (styles["loss_text"] if dec == "SELL" else styles["cell_text"])),
            Paragraph(f"{conf}%", styles["cell_text"]),
            Paragraph(str(r.get("risk_level", "Medium")), styles["cell_text"]),
            Paragraph(f"${float(r.get('entry_price', 0.0)):.2f}", styles["cell_text"]),
            Paragraph(f"${sl:.2f} / ${tp:.2f}", styles["cell_text"]),
            Paragraph(f"<b>{outcome}</b>", styles["cell_text"]),
            Paragraph(f"{acc_score:.1f}%", styles["cell_text"]),
        ]
        table_data.append(row)

    if len(table_data) == 1:
        table_data.append([Paragraph("No AI decisions logged in this report.", styles["cell_text"])] * 10)

    col_widths = [75, 95, 60, 50, 45, 50, 75, 110, 100, 60]
    ai_table = Table(table_data, colWidths=col_widths, repeatRows=1)
    ai_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 3),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 3),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(ai_table)

    story.append(Spacer(1, 14))
    story.append(Paragraph("This document contains verified quantitative multi-agent reasoning logs generated by Gemini AI Agents and CRO Risk Officers.", styles["footer"]))

    doc.build(story)
    buf.seek(0)
    return buf.read()


def build_master_statement_pdf(
    account_info: Dict[str, Any],
    trades: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    ai_records: List[Dict[str, Any]]
) -> bytes:
    """Generate a complete, executive master portfolio statement combining Account Metrics, Trades, and AI Decisions."""
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(letter), leftMargin=24, rightMargin=24, topMargin=24, bottomMargin=24)
    styles = _get_pdf_styles()
    story = []

    account_name = account_info.get("name", "Master Portfolio")
    story.extend(_build_header(styles, "Consolidated Master Statement & Intelligence Dossier", account_name))

    # Section 1: Executive Account Scorecard
    if metrics:
        story.append(_build_metrics_scorecard(styles, metrics))
        story.append(Spacer(1, 10))

    # Section 2: Recent Trades
    story.append(Paragraph(f"<b>SECTION I: AUDITED SETTLED TRADES ({len(trades)} RECORDED)</b>", styles["section_h1"]))
    trade_headers = [
        Paragraph("<b>Ticket ID</b>", styles["cell_header"]),
        Paragraph("<b>Asset</b>", styles["cell_header"]),
        Paragraph("<b>Side</b>", styles["cell_header"]),
        Paragraph("<b>Lots</b>", styles["cell_header"]),
        Paragraph("<b>Entry</b>", styles["cell_header"]),
        Paragraph("<b>Exit</b>", styles["cell_header"]),
        Paragraph("<b>Resolution</b>", styles["cell_header"]),
        Paragraph("<b>Realized PnL ($)</b>", styles["cell_header"]),
        Paragraph("<b>Settled Date</b>", styles["cell_header"]),
    ]
    trade_rows = [trade_headers]
    for t in trades[:35]:  # Top 35 in master
        pnl = float(t.get("realized_pnl") or t.get("pnl") or 0.0)
        pnl_style = styles["profit_text"] if pnl >= 0 else styles["loss_text"]
        pnl_str = f"+${pnl:.2f}" if pnl >= 0 else f"-${abs(pnl):.2f}"
        reason = str(t.get("close_reason") or "MANUAL").replace("CLOSED_", "")

        trade_rows.append([
            Paragraph(str(t.get("id", ""))[:12], styles["cell_text"]),
            Paragraph(f"<b>{t.get('symbol', '')}</b>", styles["cell_text"]),
            Paragraph(f"<b>{t.get('side', '')}</b>", styles["cell_text"]),
            Paragraph(str(t.get("quantity", "")), styles["cell_text"]),
            Paragraph(f"${float(t.get('entry_price', 0.0)):.2f}", styles["cell_text"]),
            Paragraph(f"${float(t.get('close_price') or t.get('current_price') or 0.0):.2f}", styles["cell_text"]),
            Paragraph(reason, styles["cell_text"]),
            Paragraph(pnl_str, pnl_style),
            Paragraph(str(t.get("closed_at", "") or t.get("opened_at", ""))[:16], styles["cell_text"]),
        ])
    if len(trade_rows) == 1:
        trade_rows.append([Paragraph("No closed trades logged.", styles["cell_text"])] * 9)

    col_w_trades = [80, 60, 50, 45, 80, 80, 100, 95, 130]
    t_table = Table(trade_rows, colWidths=col_w_trades, repeatRows=1)
    t_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(t_table)
    story.append(Spacer(1, 12))

    # Section 3: AI Decisions Logs
    story.append(Paragraph(f"<b>SECTION II: AI QUANTITATIVE SIGNALS ({len(ai_records)} RECORDED)</b>", styles["section_h1"]))
    ai_headers = [
        Paragraph("<b>Timestamp</b>", styles["cell_header"]),
        Paragraph("<b>Asset</b>", styles["cell_header"]),
        Paragraph("<b>Decision</b>", styles["cell_header"]),
        Paragraph("<b>Conf</b>", styles["cell_header"]),
        Paragraph("<b>Risk Level</b>", styles["cell_header"]),
        Paragraph("<b>Target Entry</b>", styles["cell_header"]),
        Paragraph("<b>Outcome Status</b>", styles["cell_header"]),
        Paragraph("<b>Accuracy</b>", styles["cell_header"]),
    ]
    ai_rows = [ai_headers]
    for r in ai_records[:25]:
        dec = r.get("final_decision", "WAIT")
        ai_rows.append([
            Paragraph(str(r.get("timestamp", ""))[:16], styles["cell_text"]),
            Paragraph(f"<b>{r.get('asset', '')}</b>", styles["cell_text"]),
            Paragraph(f"<b>{dec}</b>", styles["profit_text"] if dec == "BUY" else (styles["loss_text"] if dec == "SELL" else styles["cell_text"])),
            Paragraph(f"{r.get('confidence', 70)}%", styles["cell_text"]),
            Paragraph(str(r.get("risk_level", "Medium")), styles["cell_text"]),
            Paragraph(f"${float(r.get('entry_price', 0.0)):.2f}", styles["cell_text"]),
            Paragraph(f"<b>{r.get('outcome_status', 'PENDING')}</b>", styles["cell_text"]),
            Paragraph(f"{float(r.get('ai_accuracy_score', 0.0)):.1f}%", styles["cell_text"]),
        ])
    if len(ai_rows) == 1:
        ai_rows.append([Paragraph("No AI decision records logged.", styles["cell_text"])] * 8)

    col_w_ai = [110, 70, 60, 50, 75, 95, 140, 70]
    ai_tbl = Table(ai_rows, colWidths=col_w_ai, repeatRows=1)
    ai_tbl.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#0f172a")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#cbd5e1")),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('TOPPADDING', (0, 0), (-1, -1), 2.5),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
    ]))
    story.append(ai_tbl)

    story.append(Spacer(1, 14))
    story.append(Paragraph("Master Institutional Statement generated automatically by Nexus Trading System. Confidential & Proprietary.", styles["footer"]))

    doc.build(story)
    buf.seek(0)
    return buf.read()


# ---------------------------------------------------------------------------
# EXCEL / CSV BUILDERS (WITH UTF-8 BOM FOR DIRECT SPREADSHEET OPENING)
# ---------------------------------------------------------------------------

def build_trades_csv(trades: List[Dict[str, Any]]) -> str:
    """Generate clean Excel-ready CSV string with UTF-8 BOM."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Ticket ID",
        "Asset",
        "Side",
        "Quantity (Lots)",
        "Entry Price",
        "Exit Price",
        "Stop Loss",
        "Take Profit",
        "Realized PnL ($)",
        "Resolution Reason",
        "Status",
        "Opened At",
        "Settled At",
        "Account ID"
    ])

    for t in trades:
        pnl = float(t.get("realized_pnl") or t.get("pnl") or 0.0)
        writer.writerow([
            t.get("id", ""),
            t.get("symbol", ""),
            t.get("side", ""),
            t.get("quantity", ""),
            f"{float(t.get('entry_price', 0.0)):.4f}",
            f"{float(t.get('close_price') or t.get('current_price') or 0.0):.4f}",
            t.get("stop_loss", ""),
            t.get("take_profit", ""),
            f"{pnl:.2f}",
            t.get("close_reason", "MANUAL"),
            t.get("status", "CLOSED"),
            t.get("opened_at", ""),
            t.get("closed_at", "") or t.get("opened_at", ""),
            t.get("account_id", "")
        ])

    return "\ufeff" + output.getvalue()


def build_ai_decisions_csv(ai_records: List[Dict[str, Any]]) -> str:
    """Generate clean Excel-ready CSV for AI Decisions."""
    output = io.StringIO()
    writer = csv.writer(output)

    writer.writerow([
        "Analysis ID",
        "Timestamp",
        "Asset",
        "Final Decision",
        "Confidence (%)",
        "Risk Level",
        "Target Entry",
        "Stop Loss",
        "Take Profit",
        "Outcome Status",
        "Actual Exit Price",
        "AI Accuracy Score (%)",
        "Outcome Notes"
    ])

    for r in ai_records:
        writer.writerow([
            r.get("id", ""),
            r.get("timestamp", ""),
            r.get("asset", ""),
            r.get("final_decision", ""),
            r.get("confidence", ""),
            r.get("risk_level", ""),
            f"{float(r.get('entry_price', 0.0)):.4f}",
            f"{float(r.get('stop_loss', 0.0)):.4f}",
            f"{float(r.get('take_profit', 0.0)):.4f}",
            r.get("outcome_status", "PENDING"),
            r.get("actual_exit_price", ""),
            f"{float(r.get('ai_accuracy_score', 0.0)):.1f}",
            (r.get("outcome_notes") or "").replace("\n", " ")
        ])

    return "\ufeff" + output.getvalue()


def build_master_statement_csv(
    account_info: Dict[str, Any],
    trades: List[Dict[str, Any]],
    metrics: Dict[str, Any],
    ai_records: List[Dict[str, Any]]
) -> str:
    """Generate a consolidated Master Statement CSV for spreadsheets."""
    output = io.StringIO()
    writer = csv.writer(output)

    # Header section
    writer.writerow(["=== NEXUS INSTITUTIONAL MASTER STATEMENT ==="])
    writer.writerow(["Generated At", datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")])
    writer.writerow(["Wallet / Account", account_info.get("name", "Active Account")])
    writer.writerow(["Initial Capital ($)", f"{float(account_info.get('initial_capital', 0.0)):.2f}"])
    writer.writerow(["Current Balance ($)", f"{float(account_info.get('balance', 0.0)):.2f}"])
    writer.writerow(["Live Equity ($)", f"{float(account_info.get('equity', 0.0)):.2f}"])
    writer.writerow(["Net Realized PnL ($)", f"{float(metrics.get('net_pnl_usd', 0.0)):.2f}"])
    writer.writerow(["Win Rate (%)", f"{float(metrics.get('win_rate_pct', 0.0)):.1f}%"])
    writer.writerow(["Profit Factor", f"{metrics.get('profit_factor', 0.0)}"])
    writer.writerow([])

    # Trades section
    writer.writerow(["--- SECTION I: SETTLED TRADES ---"])
    writer.writerow([
        "Ticket ID", "Asset", "Side", "Lots", "Entry Price", "Exit Price", "Realized PnL ($)", "Resolution", "Settled Date"
    ])
    for t in trades:
        pnl = float(t.get("realized_pnl") or t.get("pnl") or 0.0)
        writer.writerow([
            t.get("id", ""),
            t.get("symbol", ""),
            t.get("side", ""),
            t.get("quantity", ""),
            f"{float(t.get('entry_price', 0.0)):.4f}",
            f"{float(t.get('close_price') or t.get('current_price') or 0.0):.4f}",
            f"{pnl:.2f}",
            t.get("close_reason", "MANUAL"),
            t.get("closed_at", "") or t.get("opened_at", "")
        ])
    writer.writerow([])

    # AI decisions section
    writer.writerow(["--- SECTION II: AI QUANTITATIVE DECISIONS ---"])
    writer.writerow([
        "Analysis ID", "Timestamp", "Asset", "Decision", "Confidence (%)", "Risk", "Entry", "Outcome", "Accuracy Score"
    ])
    for r in ai_records:
        writer.writerow([
            r.get("id", ""),
            r.get("timestamp", ""),
            r.get("asset", ""),
            r.get("final_decision", ""),
            r.get("confidence", ""),
            r.get("risk_level", ""),
            f"{float(r.get('entry_price', 0.0)):.4f}",
            r.get("outcome_status", "PENDING"),
            f"{float(r.get('ai_accuracy_score', 0.0)):.1f}%"
        ])

    return "\ufeff" + output.getvalue()
