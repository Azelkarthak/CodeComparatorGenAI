def factorial(n):
    if n == 0 or n == 1:  # Base case
        return 1
    return n * factorial(n - 1)  # Recursive case

# Example usage
num = 5
print(f"The factorial of {num} is {factorial(num)}")
