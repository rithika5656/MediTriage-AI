"""
Safe calculator tool used by the planner for dose/interval arithmetic.
"""
from __future__ import annotations

import ast
import operator as op
from typing import Any


_OPERATORS = {
    ast.Add: op.add,
    ast.Sub: op.sub,
    ast.Mult: op.mul,
    ast.Div: op.truediv,
    ast.Pow: op.pow,
    ast.USub: op.neg,
    ast.Mod: op.mod,
}


def _evaluate(node: ast.AST) -> Any:
    if isinstance(node, ast.Num):
        return node.n
    if isinstance(node, ast.UnaryOp) and type(node.op) in _OPERATORS:
        return _OPERATORS[type(node.op)](_evaluate(node.operand))
    if isinstance(node, ast.BinOp) and type(node.op) in _OPERATORS:
        return _OPERATORS[type(node.op)](_evaluate(node.left), _evaluate(node.right))
    raise ValueError("Unsupported expression")


def safe_calculate(expression: str) -> float:
    tree = ast.parse(expression, mode="eval")
    return float(_evaluate(tree.body))
