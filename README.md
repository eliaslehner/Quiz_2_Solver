# Propositional Logic Calculator

A web-based tool to solve various propositional logic problems and exercises.

## Overview

This application provides multiple calculators for propositional logic, including:

- Truth Table Generator
- Satisfiability Checker
- Subformula by Position
- Unit Propagation (CNF)
- Interpretation Testing
- Polarity Calculation
- Unit Propagation Determinism (CNF)
- Pure Atom Simplification
- Unit Propagation Determinism (General)
- Tseytin Transformation

## Usage

1. Select a calculation type from the dropdown menu
2. Click "Load Module" to initialize the selected calculator
3. Enter the propositional formula using the input field (you can use the buttons for symbols)
4. Fill in any additional inputs required by the specific calculator
5. Click "Calculate" to see the results
6. Use "Reset" to clear all inputs

## Formula Syntax

The calculator supports standard propositional logic symbols:
- Variables: a, b, c, d, e, f, g
- Operators: 
  - Negation (¬)
  - Conjunction (∧)
  - Disjunction (∨)
  - Implication (→)
  - Biconditional (↔)
- Constants: True (⊤), False (⊥)

## Features

- Dynamic interface that adapts based on the selected calculator
- Position input for features like subformula extraction
- Interpretation testing for evaluating formulas under specific interpretations
- Tree visualization for formula structure
- Support for various propositional logic calculations commonly needed for exercises

## Technical Details

This application uses a modular architecture where each calculator is loaded dynamically. The core parsing and evaluation logic is shared across modules, while specific algorithms are implemented in separate files.

Created by Lehner Elias