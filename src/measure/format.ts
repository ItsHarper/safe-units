import { type BasisType, UnitSymbol, UnitSystem } from "./unitSystem";
import { Unit } from "./unitTypeArithmetic";

type SymbolAndExponent = [symbol: UnitSymbol, exponent: number];

export function defaultFormatUnit<Basis extends BasisType>(
    unit: Unit<Basis>,
    unitSystem: UnitSystem<Basis>,
): {
    unitStr: string;
    displayInFront: boolean;
} {
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
        return { unitStr: "", displayInFront: false };
    }

    positive.sort(orderDimensions);
    negative.sort(orderDimensions);

    if (positive.length === 0) {
        // Units that involve negative exponents are never displayed in front
        return { unitStr: formatDimensions(negative), displayInFront: false };
    }

    const numerator = formatDimensions(positive);
    if (negative.length === 0) {
        let displayInFront = false;
        if (positive.length === 1) {
            const dimension = positive[0];
            const symbol = dimension[0];
            const exponent = dimension[1];
            displayInFront = exponent === 1 && typeof symbol === "object" && symbol.displayInFront;
        }
        return { unitStr: numerator, displayInFront };
    }

    const denominator = formatDimensions(negative.map(negateDimension));
    return {
        // Units that involve division are never displayed in front
        unitStr: `${numerator} / ${maybeParenthesize(denominator, negative.length !== 1)}`,
        displayInFront: false,
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
