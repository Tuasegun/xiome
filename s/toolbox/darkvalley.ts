
export type Validator<xValue> = (value: xValue) => string[]

export function validator<xValue>(...conditions: Validator<xValue>[]): Validator<xValue> {
	return value => {
		const problems: string[] = []
		for (const condition of conditions) {
			for (const problem of condition(value))
				problems.push(problem)
		}
		return problems
	}
}

export function branch<xValue>(...conditions: Validator<xValue>[]): Validator<xValue> {
	return value => {
		const results = conditions.map(condition => condition(value))
		let anySuccess = false
		for (const problems of results)
			if (problems.length === 0)
				anySuccess = true
		return anySuccess
			? []
			: results.flat()
				.map((problem, index) => index > 0 ? `or, ${problem}` : problem)
	}
}

export function one<xValue>(
		...conditions: Validator<xValue>[]
	): Validator<xValue> {
	return value => {
		let problems: string[] = []
		for (const condition of conditions) {
			problems = condition(value)
			if (problems.length > 0)
				break
		}
		return problems
	}
}

export function depend<xValue>(
		first: Validator<xValue>,
		...conditions: Validator<xValue>[]
	): Validator<xValue> {
	return value => {
		const problems = first(value)
		if (problems.length === 0) {
			for (const condition of conditions) {
				for (const problem of condition(value))
					problems.push(problem)
			}
		}
		return problems
	}
}

export function each<xValue>(
		...conditions: Validator<xValue>[]
	): Validator<xValue[]> {
	return arr => {
		if (!Array.isArray(arr)) return ["must be array"]
		const validate = validator<xValue>(...conditions)
		const problems: string[] = []
		arr.forEach((item, index) => {
			for (const problem of validate(item))
				problems.push(`(${index + 1}) ${problem}`)
		})
		return problems
	}
}

export const string = (): Validator<string> => value =>
	typeof value !== "string"
		? ["must be a string"]
		: []

export const number = (): Validator<number> => value =>
	typeof value !== "number"
		? ["must be a number"]
		: []


export const array = (): Validator<string> => value =>
	Array.isArray(value)
		? []
		: ["must be an array"]

export const length = (len: number): Validator<{length: number}> => value =>
	value.length !== len
		? [`length must be ${len}`]
		: []

export const minLength = (min: number): Validator<{length: number}> => value =>
	value.length < min
		? ["too small"]
		: []

export const maxLength = (max: number): Validator<{length: number}> => value =>
	value.length > max
		? ["too big"]
		: []

export const notWhitespace = (): Validator<string> => value =>
	value.trim().length === 0
		? ["can't be all whitespace"]
		: []

export const url = (): Validator<string> => value => {
	try {
		void new URL(value)
		return []
	}
	catch (error) {
		return ["invalid url"]
	}
}

export const localhost = (): Validator<string> => value => {
	return /^https?:\/\/localhost$/i.test(value)
		? []
		: ["must be 'http://localhost' or 'https://localhost'"]
}

export const https = (): Validator<string> => value => {
	return /^https:\/\//i.test(value)
		? []
		: ["must be secure, starting with 'https'"]
}

export const origin = (): Validator<string> => value =>
	/^https?:\/\/[a-zA-Z\.\d]+(?:|:\d+)$/i.test(value)
		? []
		: ["invalid origin"]

const emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/

export const email = (): Validator<string> => value =>
	emailRegex.test(value)
		? []
		: ["invalid email"]

// const labelValidator = validator<string>(string(), minLength(1), maxLength(50), notWhitespace())
// const problems = labelValidator("hello")
// const problems2 = validator<string[]>(array(string()))
