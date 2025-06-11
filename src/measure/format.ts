import {type BasisType, UnitSymbol, type UnitSymbolWithOptions, UnitSystem} from "./unitSystem";
import { Unit } from "./unitTypeArithmetic";

type SymbolAndExponent = [symbol: UnitSymbol, exponent: number];

export function defaultFormatUnit<Basis extends BasisType>(
    unit: Unit<Basis>,
    unitSystem: UnitSystem<Basis>,
): UnitSymbolWithOptions {
    const defaultSymbolOptions = { displayInFront: false, displayWithoutGap: false };

    const positive: SymbolAndExponent[] = [];
    const negative: SymbolAndExponent[] = [];
    unitSystem.getDimensions().forEach(dimension => {
        const exponent = unit[dimension];
        if (exponent < 0) {
            negative.push([unitSystem.getSymbol(dimension), unit[dimension]]);
        } else if (exponent > 0) {
            positive.push([unitSystem.getSymbol(dimension), unit[dimension]]);
        }
    });

    if (positive.length === 0 && negative.length === 0) {
        return { symbol: "", ...defaultSymbolOptions };
    }

    positive.sort(orderDimensions);
    negative.sort(orderDimensions);

    if (positive.length === 0) {
        // Units that involve division are always displayed with the default options
        return { symbol: formatDimensions(negative), ...defaultSymbolOptions };
    }

    const numerator = formatDimensions(positive);
    if (negative.length === 0) {
        if (positive.length === 1) {
            const dimension = positive[0];
            const symbol = dimension[0];
            const exponent = dimension[1];
            if (exponent === 1 && typeof symbol === "object") {
                return {
                    symbol: numerator,
                    displayInFront: symbol.displayInFront,
                    displayWithoutGap: symbol.displayWithoutGap,
                };
            }
        }
        return { symbol: numerator, ...defaultSymbolOptions };
    }

    const denominator = formatDimensions(negative.map(negateDimension));
    return {
        symbol: `${numerator} / ${maybeParenthesize(denominator, negative.length !== 1)}`,
        // Units that involve division are always displayed with the default options
        ...defaultSymbolOptions,
    };
}

function orderDimensions([leftSymbol]: SymbolAndExponent, [rightSymbol]: SymbolAndExponent): number {
    return leftSymbol < rightSymbol ? -1 : 1;
}

function formatDimensions(dimensions: SymbolAndExponent[]): string {
    return dimensions
        .map(([symbol, exponent]) => {
            const symbolStr: string = typeof symbol === "string" ? symbol : symbol.symbol;
            const exponentStr = exponent !== 1 ? `^${exponent}` : "";
            return `${symbolStr}${exponentStr}`;
        })
        .join(" * ");
}

function negateDimension([symbol, exponent]: SymbolAndExponent): SymbolAndExponent {
    return [symbol, -exponent];
}

function maybeParenthesize(text: string, parenthesize: boolean): string {
    return parenthesize ? `(${text})` : text;
}
